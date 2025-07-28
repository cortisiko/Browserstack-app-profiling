import { config } from './wdio.mocha.conf.js';

(config as any).capabilities = [
  {
    'appium:platformName': 'Android',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:deviceName': 'emulator-5554',
    'appium:platformVersion': '14',
    'appium:app': '/Users/curtisdavid/Downloads/7.45.2.apk',
    'appium:automationName': 'uiautomator2',
  }
];

export { config };