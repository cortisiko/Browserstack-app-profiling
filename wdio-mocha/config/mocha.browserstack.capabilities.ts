import { removeSync } from 'fs-extra';
import generateTestReports from '../../wdio/utils/generateTestReports';
import { config } from './wdio.mocha.conf.js';

config.user = process.env.BROWSERSTACK_USERNAME;
config.key = process.env.BROWSERSTACK_ACCESS_KEY;

// Debug environment variables
console.log('Android BrowserStack Config Debug:');
console.log('BROWSERSTACK_ANDROID_APP_URL:', process.env.BROWSERSTACK_ANDROID_APP_URL);
console.log('BROWSERSTACK_DEVICE:', process.env.BROWSERSTACK_DEVICE);
console.log('BROWSERSTACK_OS_VERSION:', process.env.BROWSERSTACK_OS_VERSION);

const defaultCapabilities = [
  {
    platformName: 'Android',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:maxInstances': 1,
    'appium:build': 'Android App Profiling Tests',
    'appium:deviceName': process.env.BROWSERSTACK_DEVICE || 'Xiaomi Redmi Note 11',
    'appium:os_version': process.env.BROWSERSTACK_OS_VERSION || '11.0',
    // 'appium:app': 'bs://1f15f8c932c7019f6bcd26d5f496c52dd45b12bd',
    // 'appium:app': 'bs://f1eb1557acc5d30d8eda5ec6fe01a3909430b95f', // v 7.46.2
    'appium:app': process.env.BROWSERSTACK_ANDROID_APP_URL,
    'appium:autoLaunch': false,
    'bstack:options': {
      appProfiling: 'true',
      "local": process.env.BROWSERSTACK_LOCAL || false,
      interactiveDebugging: 'true',
      localIdentifier: process.env.BROWSERSTACK_LOCAL_IDENTIFIER || process.env.GITHUB_RUN_ID,
      networkLogs: 'true',
      networkLogsOptions: {
        captureContent: 'true'
      }
    }
  }
];

(config as any).capabilities = defaultCapabilities;

// // Simple onPrepare hook
// config.onPrepare = function (config, capabilities) {
//   removeSync('./wdio-mocha/reports');
//   console.log('=== onPrepare called ===');
// };

// // Simple onComplete hook
// config.onComplete = function (exitCode, config, capabilities, results) {
//   generateTestReports();
//   console.log('=== onComplete called ===');
// };

delete config.port;
delete config.path;
delete config.services;

export { config };