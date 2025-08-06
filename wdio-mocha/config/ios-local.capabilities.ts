import { config } from './wdio.mocha.conf.js';

(config as any).capabilities  = [
    {
      platformName: 'iOS',
      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:automationName': 'XCUITest',
      'appium:deviceName': 'iPhone 16 Pro',
      'appium:platformVersion': '18.2',
      'appium:app': './wdio-mocha/metamask-simulator-main-e2e.app',
      'appium:settings': {
        snapshotMaxDepth: 100, // Enable testID on deep nested elements
      },
      'appium:language': 'en',
      'appium:autoLaunch': false,

    },
  ];

export { config };