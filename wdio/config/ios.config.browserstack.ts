import { removeSync } from 'fs-extra';
import type { Options } from '@wdio/types';
import generateTestReports from '../utils/generateTestReports.js';
import BrowserStackAPI from '../utils/browserstackApi.js';
import { config } from '../../wdio.conf.js';

const browserstack = require('browserstack-local');

// BrowserStack credentials
config.user = process.env.BROWSERSTACK_USERNAME;
config.key = process.env.BROWSERSTACK_ACCESS_KEY;

// Define iOS capabilities for non-upgrade and upgrade tests
const defaultCapabilities = [
{
  "platformName": "iOS",
  "maxInstances": 1,
  "appium:deviceName": "iPhone 15 Pro",
  "appium:platformVersion": "17.3",
  "appium:automationName": "XCUITest",
  "appium:app": process.env.BROWSERSTACK_IOS_APP_URL,
  "appium:noReset": false,
  "appium:fullReset": false,
  "appium:settings[snapshotMaxDepth]": 62,
  "appium:settings[customSnapshotTimeout]": 50000,
  "bstack:options": {
    "appProfiling": "true",
    "local": "true",
    "localIdentifier": process.env.GITHUB_RUN_ID,
    "interactiveDebugging": true,
    "buildName": "iOS App Launch Times Tests",
    "networkLogs": "true",
    "deviceLogs": "true",
    "debug": "true"
  }
}

];

const upgradeCapabilities = [
  {
    platformName: 'iOS',
    maxInstances: 1,
    'appium:deviceName': process.env.BROWSERSTACK_DEVICE || 'iPhone 15 Pro',
    'appium:platformVersion': process.env.BROWSERSTACK_OS_VERSION || '17.3',
    'appium:automationName': 'XCUITest',
    'appium:app': process.env.PRODUCTION_APP_URL || process.env.BROWSERSTACK_IOS_APP_URL,
    'appium:noReset': true,
    // Optimal settings for React Native element detection
    'appium:settings[snapshotMaxDepth]': 50,        // Reduced from 62 for better performance
    'appium:settings[customSnapshotTimeout]': 20000, // Reduced from 50000 for faster detection
    'bstack:options': {
      buildName: 'iOS App Upgrade E2E',
      local: 'true',
      localIdentifier: process.env.GITHUB_RUN_ID,
      networkLogs: "true",
      deviceLogs: "true",
      debug: "true"
    },
  },
];

// Determine selected capabilities and tags
const isAppUpgrade = process.argv.includes('--upgrade');
const isPerformance = process.argv.includes('--performance');
const { selectedCapabilities, defaultTagExpression } = (() => {
  if (isAppUpgrade) {
      return {
          selectedCapabilities: upgradeCapabilities,
          defaultTagExpression: '@upgrade and @iosApp',
      };
  } else if (isPerformance) {
      return {
          selectedCapabilities: defaultCapabilities,
          defaultTagExpression: '@temp and @iosApp',
      };
  } else {
      return {
          selectedCapabilities: defaultCapabilities,
          defaultTagExpression: '@smoke and @iosApp',
      };
  }
})();

// Apply the selected configuration
(config as any).capabilities = selectedCapabilities;
config.cucumberOpts!.tagExpression = process.env.BROWSERSTACK_TAG_EXPRESSION || defaultTagExpression;

config.waitforTimeout = 10000;
config.connectionRetryTimeout = 90000;
config.connectionRetryCount = 3;
// BrowserStack Local setup
// Add BrowserStack service for local testing
config.services = [
  [
    'browserstack',
    {
      accessibility: false,
      buildIdentifier: 'metamask-mobile-tests',
      browserstackLocal: false, // Don't start a new tunnel, use the one from GitHub Actions
      localIdentifier: process.env.GITHUB_RUN_ID, // Use the same identifier as GitHub Actions
    }
  ]
];

config.onPrepare = function (config: any, capabilities: any) {
  removeSync('./wdio/reports');
};

// Store session information for later use
let sessionInfo: any = null;

config.beforeSession = function (config: any, capabilities: any, specs: any) {
  // This will be called before each session starts
  console.log('Session starting with capabilities:', capabilities);
};

config.before = async function (capabilities: any, specs: any, browser: any) {
  // This will be called before each test starts, when the driver is available
  console.log('=== before called ===');
  console.log('Browser object:', browser);
  
  // Debug BrowserStack local tunnel configuration
  console.log('=== BrowserStack Local Tunnel Debug ===');
  console.log('GITHUB_RUN_ID:', process.env.GITHUB_RUN_ID);
  console.log('BROWSERSTACK_LOCAL_IDENTIFIER:', process.env.BROWSERSTACK_LOCAL_IDENTIFIER);
  console.log('BROWSERSTACK_LOCAL:', process.env.BROWSERSTACK_LOCAL);
  console.log('BROWSERSTACK_USERNAME:', process.env.BROWSERSTACK_USERNAME ? 'SET' : 'NOT SET');
  console.log('BROWSERSTACK_ACCESS_KEY:', process.env.BROWSERSTACK_ACCESS_KEY ? 'SET' : 'NOT SET');
  
  try {
    // Get the actual BrowserStack session ID from the driver
    const sessionCapabilities = await browser.getSession();
    console.log('Session capabilities in before:', JSON.stringify(sessionCapabilities, null, 2));
    
    // The session ID from capabilities is usually the device UDID, not the BrowserStack session ID
    // We'll need to extract the actual BrowserStack session ID from the test output later
    const deviceUDID = sessionCapabilities.sessionId;
    console.log('Device UDID from capabilities:', deviceUDID);
    
    sessionInfo = {
      sessionId: null, // Will be set later from test output
      deviceUDID: deviceUDID,
      buildId: sessionCapabilities['bstack:options']?.buildIdentifier || 
               sessionCapabilities.build ||
               sessionCapabilities['appium:build'],
      capabilities: sessionCapabilities
    };
    
    // Store globally so it can be accessed from Cucumber steps
    (global as any).sessionInfo = sessionInfo;
    (globalThis as any).sessionInfo = sessionInfo;
    
    console.log('Session info stored in before:', JSON.stringify(sessionInfo, null, 2));
    console.log('Session info stored globally:', JSON.stringify((global as any).sessionInfo, null, 2));
    
    // Try to capture the actual BrowserStack session ID
    try {
      const api = new BrowserStackAPI();
      
      // Look for BrowserStack session ID in the capabilities or environment
      const browserstackSessionId = sessionCapabilities['bstack:options']?.sessionId ||
                                   process.env.BROWSERSTACK_SESSION_ID ||
                                   deviceUDID;
      
      if (browserstackSessionId) {
        api.captureCurrentSessionId(browserstackSessionId);
      }
    } catch (error) {
      console.error('Error capturing session ID:', error);
    }
  } catch (error) {
    console.error('Error capturing session info in before:', error);
    console.error('Error stack:', (error as Error).stack);
  }
};

config.afterSession = async function (config: any, capabilities: any, specs: any) {
  // This will be called after each session ends
  console.log('=== afterSession called ===');
  console.log('Config:', JSON.stringify(config, null, 2));
  console.log('Capabilities:', JSON.stringify(capabilities, null, 2));
  console.log('Specs:', specs);
  console.log('Session info available in afterSession:', !!sessionInfo);
  console.log('Session info in afterSession:', JSON.stringify(sessionInfo, null, 2));
};

config.onComplete = async function (exitCode: any, config: any, capabilities: any, results: any) {
  // Generate test reports
  generateTestReports();
  
  // Collect app profiling data for the current session only
  try {
    console.log('=== Collecting app profiling data for current session ===');
    
    const api = new BrowserStackAPI();
    
    // Use the new method that only gets data for the current session
    const profilingData = await api.getCurrentSessionProfilingData();
    
    if (profilingData) {
      // Save the profiling data with a timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `current-session-profiling-${timestamp}.json`;
      api.saveProfilingData(profilingData, filename);
      
      console.log(`Profiling data saved for current session: ${filename}`);
    } else {
      console.log('No profiling data available for current session');
    }
    
  } catch (error) {
    console.error('Error collecting profiling data:', error);
    console.error('Error stack:', (error as Error).stack);
  }
};

delete (config as any).port;
delete (config as any).path;
delete (config as any).services;

export { config }; 