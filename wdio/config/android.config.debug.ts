import { config } from '../../wdio.conf.js';

// Appium capabilities
// https://appium.io/docs/en/writing-running-appium/caps/
(config as any).capabilities = [

    {
      'appium:platformName': 'Android',
      'appium:noReset': false,
      'appium:fullReset': false,
      maxInstances: 1,
      'appium:deviceName': 'Pixel 6',
      'appium:platformVersion': '14',
      'appium:app': '/Users/curtisdavid/Downloads/7.45.2.apk',
      'appium:automationName': 'uiautomator2',
  
    },
  

];

config.cucumberOpts.tags = '@temp and @androidApp';

const _config = config;
 
export { _config as config }; 