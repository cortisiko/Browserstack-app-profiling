import { config } from './wdio.mocha.conf.js';

(config as any).capabilities = [
  {
    'appium:platformName': 'Android',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:deviceName': 'emulator-5554',
    'appium:platformVersion': '14',
    'appium:app': '/Users/curtisdavid/Downloads/build-qa-app-test-for-fixtures.apk',
    'appium:automationName': 'uiautomator2',
  }
];

export { config };