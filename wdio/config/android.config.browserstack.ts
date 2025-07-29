import { removeSync } from 'fs-extra';
import type { Options } from '@wdio/types';
import generateTestReports from '../../wdio/utils/generateTestReports';
import BrowserStackAPI from '../../wdio/utils/browserstackApi';
import { config } from '../../wdio.conf.js';
import path from 'path';
import fs from 'fs';

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
    'appium:build': 'Android App Profiling Tests',
    'appium:deviceName': process.env.BROWSERSTACK_DEVICE || 'Xiaomi Redmi Note 11',
    'appium:os_version': process.env.BROWSERSTACK_OS_VERSION || '11.0',
    'appium:app': 'bs://0d0b48d657c5b1ff8b20322c8e085aa1367f4221',
    'bstack:options' : {
        "appProfiling" : "true",
        "local": process.env.BROWSERSTACK_LOCAL === 'true' ? "true" : "false",
        "localIdentifier": process.env.GITHUB_RUN_ID,
        "networkLogs": "true",
        "networkLogsOptions": {
            "captureContent": "true"
        }
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
      "local": process.env.BROWSERSTACK_LOCAL === 'true' ? "true" : "false",
      "debug": true,
      "localIdentifier": process.env.BROWSERSTACK_LOCAL_IDENTIFIER || process.env.GITHUB_RUN_ID,
      "midSessionInstallApps" : [process.env.BROWSERSTACK_ANDROID_APP_URL],
      "networkLogs": "true",
      "networkLogsOptions": {
          "captureContent": "true"
      }
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
      browserstackLocal: false,
      localIdentifier: process.env.GITHUB_RUN_ID,
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
  
  // Debug BrowserStack local tunnel configuration
  console.log('=== BrowserStack Local Tunnel Debug ===');
  console.log('GITHUB_RUN_ID:', process.env.GITHUB_RUN_ID);
  console.log('BROWSERSTACK_LOCAL_IDENTIFIER:', process.env.BROWSERSTACK_LOCAL_IDENTIFIER);
  console.log('BROWSERSTACK_LOCAL:', process.env.BROWSERSTACK_LOCAL);
  console.log('BROWSERSTACK_USERNAME:', process.env.BROWSERSTACK_USERNAME ? 'SET' : 'NOT SET');
  console.log('BROWSERSTACK_ACCESS_KEY:', process.env.BROWSERSTACK_ACCESS_KEY ? 'SET' : 'NOT SET');
  
  try {
    // Get the actual BrowserStack session ID from the driver
    // BrowserStack doesn't support getAppiumSessionCapabilities, so we'll use the browser capabilities directly
    const sessionCapabilities = browser.capabilities;
    console.log('Session capabilities in before:', JSON.stringify(sessionCapabilities, null, 2));
    
    // Store the session ID for later use
    const sessionId = browser.sessionId;
    console.log('BrowserStack Session ID:', sessionId);
    
    // Store session info globally for later access
    (global as any).currentSessionId = sessionId;
    (global as any).currentSessionCapabilities = sessionCapabilities;
    
    // The session ID from capabilities is usually the device UDID, not the BrowserStack session ID
    // We'll need to extract the actual BrowserStack session ID from the test output later
    const deviceUDID = sessionCapabilities.sessionId;
    console.log('Device UDID from capabilities:', deviceUDID);
    
    // Try to extract BrowserStack session ID from various sources
    let browserstackSessionId = null;
    
    // Method 1: Check if it's in the capabilities
    if (sessionCapabilities['bstack:options']?.sessionId) {
      browserstackSessionId = sessionCapabilities['bstack:options'].sessionId;
      console.log('Found BrowserStack session ID in capabilities:', browserstackSessionId);
    }
    
    // Method 2: Check environment variables
    if (!browserstackSessionId && process.env.BROWSERSTACK_SESSION_ID) {
      browserstackSessionId = process.env.BROWSERSTACK_SESSION_ID;
      console.log('Found BrowserStack session ID in environment:', browserstackSessionId);
    }
    
    // Method 3: Use device UDID as fallback (this might be the actual session ID)
    if (!browserstackSessionId) {
      browserstackSessionId = deviceUDID;
      console.log('Using device UDID as BrowserStack session ID:', browserstackSessionId);
    }
    
    sessionInfo = {
      sessionId: browserstackSessionId,
      deviceUDID: deviceUDID,
      buildId: sessionCapabilities['bstack:options']?.buildIdentifier || 
               sessionCapabilities.build ||
               sessionCapabilities['appium:build'],
      capabilities: sessionCapabilities
    };
    
    // Store globally so it can be accessed from Cucumber steps
    (global as any).sessionInfo = sessionInfo;
    (globalThis as any).sessionInfo = sessionInfo;
    
    console.log('=== SESSION INFO CAPTURED ===');
    console.log('BrowserStack Session ID:', browserstackSessionId);
    console.log('Device UDID:', deviceUDID);
    console.log('Build ID:', sessionInfo.buildId);
    console.log('Session info stored globally:', JSON.stringify((global as any).sessionInfo, null, 2));
    
    // Try to capture the actual BrowserStack session ID
    try {
      const api = new BrowserStackAPI();
      
      if (browserstackSessionId) {
        api.captureCurrentSessionId(browserstackSessionId);
        console.log('✓ BrowserStack session ID captured successfully');
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
  
  // Output session information clearly
  console.log('=== SESSION SUMMARY ===');
  if (sessionInfo) {
    console.log('BrowserStack Session ID:', sessionInfo.sessionId);
    console.log('Device UDID:', sessionInfo.deviceUDID);
    console.log('Build ID:', sessionInfo.buildId);
    console.log('Session info available in afterSession:', true);
    console.log('Session info in afterSession:', JSON.stringify(sessionInfo, null, 2));
  } else {
    console.log('No session info available');
  }
  
  // Collect app profiling data for the current session
  try {
    console.log('=== Collecting app profiling data for current session ===');
    
    // Try to get session ID from global storage first
    const sessionId = (global as any).currentSessionId;
    let buildId = null;
    if ((global as any).currentSessionCapabilities) {
      const caps = (global as any).currentSessionCapabilities;
      // Try to get build_hashed_id from session details if available
      if (caps['bstack:options']?.buildIdentifier) {
        buildId = caps['bstack:options'].buildIdentifier;
      } else if (caps.build) {
        buildId = caps.build;
      } else if (caps['appium:build']) {
        buildId = caps['appium:build'];
      }
    }
    // If buildId is still null, try to get it from session details API
    if (!buildId && sessionId) {
      try {
        const api = new BrowserStackAPI();
        const sessionDetails = await api.getSessionDetails(sessionId);
        if (sessionDetails && sessionDetails.automation_session && sessionDetails.automation_session.build_hashed_id) {
          buildId = sessionDetails.automation_session.build_hashed_id;
        }
      } catch (e) {
        console.warn('Could not fetch buildId from session details:', e);
      }
    }
    if (sessionId && buildId) {
      console.log('Found session ID and build ID:', sessionId, buildId);
      try {
        const profilingData = await collectAppProfilingData(sessionId);
        if (profilingData) {
          console.log('App profiling data collected successfully');
          console.log('Profiling data:', JSON.stringify(profilingData, null, 2));
          // Save profiling data to file
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `profiling-data-${sessionId}-${timestamp}.json`;
          const filepath = path.join(process.cwd(), 'wdio', 'reports', filename);
          fs.writeFileSync(filepath, JSON.stringify(profilingData, null, 2));
          console.log(`Profiling data saved to: ${filepath}`);
        } else {
          console.log('No profiling data available for current session');
        }
      } catch (error) {
        console.error('Error collecting profiling data:', error);
      }
    } else {
      console.log('No session ID or build ID found in global storage');
    }
  } catch (error) {
    console.error('Error collecting profiling data in afterSession:', error);
    console.error('Error stack:', (error as Error).stack);
  }
};

config.onComplete = async function (exitCode: any, config: any, capabilities: any, results: any) {
  console.log('=== onComplete called ===');
  console.log('Exit code:', exitCode);
  console.log('Config:', JSON.stringify(config, null, 2));
  console.log('Capabilities:', JSON.stringify(capabilities, null, 2));
  console.log('Results:', JSON.stringify(results, null, 2));
  
  // Output final session information
  console.log('=== FINAL SESSION SUMMARY ===');
  if (sessionInfo) {
    console.log('Final BrowserStack Session ID:', sessionInfo.sessionId);
    console.log('Final Device UDID:', sessionInfo.deviceUDID);
    console.log('Final Build ID:', sessionInfo.buildId);
  } else {
    console.log('No session info available in onComplete');
  }
  
  // Generate test reports
  generateTestReports();
  
  // Collect app profiling data for the current session only (backup method)
  try {
    console.log('=== Collecting app profiling data for current session (backup) ===');
    
    const api = new BrowserStackAPI();
    
    // Use the new method that only gets data for the current session
    const profilingData = await api.getCurrentSessionProfilingData();
    
    if (profilingData) {
      // Save the profiling data with a timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `final-session-profiling-${sessionInfo?.sessionId || 'unknown'}-${timestamp}.json`;
      api.saveProfilingData(profilingData, filename);
      
      console.log(`✓ Final profiling data saved for current session: ${filename}`);
      console.log('Final profiling data keys:', Object.keys(profilingData));
    } else {
      console.log('No profiling data available for current session in onComplete');
    }
    
  } catch (error) {
    console.error('Error collecting profiling data in onComplete:', error);
    console.error('Error stack:', (error as Error).stack);
  }
};

delete (config as any).port;
delete (config as any).path;
delete (config as any).services;

// Function to collect app profiling data for a specific session, with retry logic
async function collectAppProfilingData(sessionId: string) {
  const api = new BrowserStackAPI();
  const maxRetries = 12; // 2 minutes
  const delayMs = 10000; // 10 seconds
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[Profiling] Attempt ${i + 1}/${maxRetries} to fetch profiling data for session ${sessionId}`);
      
      // Capture the session ID first so the API can use it
      api.captureCurrentSessionId(sessionId);
      
      // Use the API method that properly handles build ID extraction
      const data = await api.getCurrentSessionProfilingData();
      
      if (data) {
        console.log('[Profiling] Profiling data fetched successfully.');
        return data;
      }
      
      console.log(`[Profiling] No profiling data available yet, retrying in ${delayMs/1000} seconds...`);
      
      // Only wait if this isn't the last attempt
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;
      if (isLastAttempt) {
        console.error('[Profiling] Failed to fetch profiling data after all attempts:', error);
      } else {
        console.log(`[Profiling] Attempt ${i + 1} failed, retrying in ${delayMs/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  console.log('[Profiling] Profiling data not available after all retry attempts');
  return null;
}

export { config }; 