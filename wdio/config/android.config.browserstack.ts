import { removeSync } from 'fs-extra';
import type { Options } from '@wdio/types';
import generateTestReports from '../../wdio/utils/generateTestReports';
import BrowserStackAPI from '../../wdio/utils/browserstackApi';
import { config } from '../../wdio.conf.js';

const browserstack = require('browserstack-local');

// Appium capabilities
// https://appium.io/docs/en/writing-running-appium/caps/

config.user = process.env.BROWSERSTACK_USERNAME;
config.key = process.env.BROWSERSTACK_ACCESS_KEY;

// Fix the specs path to be relative to the project root
config.specs = ['../../wdio/features/**/*.feature'];

// Clear exclude patterns to let tag filtering work
config.exclude = [];

// Remove the complex exclude patterns - let tag filtering handle it
// config.exclude = [...];

// Define capabilities for regular tests
const defaultCapabilities = [
  {
    platformName: 'Android',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:maxInstances': 1,
    'appium:build': 'Android App Launch Times Tests',
    'appium:deviceName': process.env.BROWSERSTACK_DEVICE || 'Samsung Galaxy S23 Ultra',
    'appium:os_version': process.env.BROWSERSTACK_OS_VERSION || '13.0',
    'appium:app': 'bs://4b2a122dc8eafe801a765875b94952cbf52a342e',
    'bstack:options' : {
        "appProfiling" : "true",
        "local": "true",  
    }
  }
];

// Define capabilities for app upgrade tests
const upgradeCapabilities = [
  {
    platformName: 'Android',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:maxInstances': 1,
    'appium:build': 'Android App Upgrade Tests',
    'appium:deviceName': process.env.BROWSERSTACK_DEVICE || 'Google Pixel 6',
    'appium:os_version': process.env.BROWSERSTACK_OS_VERSION || '12.0',
    'appium:app': 'bs://fe177e6812d80eb1ff6af844060e3f04cc55678a',
    'bstack:options' : {
      "appProfiling" : "true",
      "local": "true",
      "debug": true,
      "midSessionInstallApps" : [process.env.BROWSERSTACK_ANDROID_APP_URL]
  },
  },
];

// Determine test type based on command-line arguments
const isAppUpgrade = process.argv.includes('--upgrade') || false;
const isPerformance = process.argv.includes('--performance') || false;

// Consolidating the conditional logic for capabilities and tag expression
const { selectedCapabilities, defaultTagExpression } = (() => {
    if (isAppUpgrade) {
        return {
            selectedCapabilities: upgradeCapabilities,
            defaultTagExpression: '@upgrade',
        };
    } else if (isPerformance) {
        return {
            selectedCapabilities: defaultCapabilities,
            defaultTagExpression: '@temp',
        };
    } else {
        return {
            selectedCapabilities: defaultCapabilities,
            defaultTagExpression: '@smoke',
        };
    }
})();

// Apply the selected configuration
(config as any).capabilities = selectedCapabilities;

// Set the tags filter explicitly
if (config.cucumberOpts) {
  // Use standard WDIO v9 tag filtering syntax
  config.cucumberOpts.tags = process.env.BROWSERSTACK_TAG_EXPRESSION || defaultTagExpression;
}

// Add debugging for tag expression
console.log('=== Tag Expression Debug ===');
console.log('Tag Expression:', config.cucumberOpts?.tags);
console.log('Process env BROWSERSTACK_TAG_EXPRESSION:', process.env.BROWSERSTACK_TAG_EXPRESSION);
console.log('Default tag expression:', defaultTagExpression);

config.waitforTimeout = 10000;
config.connectionRetryTimeout = 90000;
config.connectionRetryCount = 3;

// Add BrowserStack service for local testing
config.services = [
  [
    'browserstack',
    {
      accessibility: false,
      buildIdentifier: 'metamask-mobile-tests',
      browserstackLocal: true,
    }
  ]
];

config.onPrepare = function (config: any, capabilities: any) {
  removeSync('./wdio/reports');
  console.log('=== onPrepare called ===');
  console.log('Config:', JSON.stringify(config, null, 2));
  console.log('Capabilities:', JSON.stringify(capabilities, null, 2));
};

// Store session information for later use
let sessionInfo: any = null;

config.beforeSession = function (config: any, capabilities: any, specs: any) {
  // This will be called before each session starts
  console.log('=== beforeSession called ===');
  console.log('Session starting with capabilities:', JSON.stringify(capabilities, null, 2));
  console.log('Specs:', specs);
};

config.before = async function (capabilities: any, specs: any, browser: any) {
  // This will be called before each test starts, when the driver is available
  console.log('=== before called ===');
  console.log('Browser object:', browser);
  
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
  console.log('=== onComplete called ===');
  console.log('Exit code:', exitCode);
  console.log('Config:', JSON.stringify(config, null, 2));
  console.log('Capabilities:', JSON.stringify(capabilities, null, 2));
  console.log('Results:', JSON.stringify(results, null, 2));
  console.log('Session info available:', !!sessionInfo);
  
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