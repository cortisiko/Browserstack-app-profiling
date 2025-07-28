import { removeSync } from 'fs-extra';
import generateTestReports from '../../wdio/utils/generateTestReports';
import { config } from './wdio.mocha.conf.js';

config.user = process.env.BROWSERSTACK_USERNAME;
config.key = process.env.BROWSERSTACK_ACCESS_KEY;

const defaultCapabilities = [
  {
    platformName: 'Android',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:maxInstances': 1,
    'appium:build': 'Android App Profiling Tests',
    'appium:deviceName': process.env.BROWSERSTACK_DEVICE || 'Xiaomi Redmi Note 11',
    'appium:os_version': process.env.BROWSERSTACK_OS_VERSION || '11.0',
    'appium:app': 'bs://f1eb1557acc5d30d8eda5ec6fe01a3909430b95f',
    'bstack:options': {
      appProfiling: 'true',
      local: 'true',
      localIdentifier: process.env.GITHUB_RUN_ID,
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