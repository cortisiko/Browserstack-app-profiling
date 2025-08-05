import { removeSync } from 'fs-extra';
import generateTestReports from '../../wdio/utils/generateTestReports';
import { config } from './wdio.mocha.conf.js';

config.user = process.env.BROWSERSTACK_USERNAME;
config.key = process.env.BROWSERSTACK_ACCESS_KEY;

const defaultCapabilities = [
    {
        platformName: 'iOS',
        'appium:build': 'iOS App Profiling Tests',
        'appium:deviceName': process.env.BROWSERSTACK_DEVICE || 'iPhone 15 Pro Max',
        'appium:os_version': process.env.BROWSERSTACK_OS_VERSION || '17.0',
        'appium:automationName': 'XCUITest',
        'appium:app': process.env.BROWSERSTACK_ANDROID_APP_URL,
        // 'appium:app': 'bs://7a42bf53dcdf1e51761f4c14a541500656b910bb',
        'appium:settings[snapshotMaxDepth]': 62,
        'appium:settings[customSnapshotTimeout]': 50000,
        'bstack:options': {
          appProfiling: true,
          local: true,
          localIdentifier: process.env.GITHUB_RUN_ID,
          interactiveDebugging: true,
          networkLogs: true,
          networkLogsOptions: {
            captureContent: true,
          },
        },
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