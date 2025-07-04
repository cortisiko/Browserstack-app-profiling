import { config } from '../../wdio.conf.js';

// Appium capabilities
// https://appium.io/docs/en/writing-running-appium/caps/
(config as any).capabilities = [
  {
    platformName: 'iOS',
    noReset: false,
    fullReset: false,
    maxInstances: 1,
    automationName: 'XCUITest',
    deviceName: 'iPhone 13 Pro',
    platformVersion: '15.5',
    app: './ios/build/Build/Products/Debug-iphonesimulator/MetaMask-QA.app',
    settings: {
      snapshotMaxDepth: 100, // Enable testID on deep nested elements
    },
    language: 'en',
  },
];

config.cucumberOpts!.tagExpression = '@performance and @iosApp'; // pass tag to run tests specific to ios

const _config = config;
 
export { _config as config }; 