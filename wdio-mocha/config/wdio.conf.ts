import { removeSync } from 'fs-extra';
import type { Options } from '@wdio/types';
import generateTestReports from '../../wdio/utils/generateTestReports';

// Standalone config for local Appium testing
export const config: Options.Testrunner = {
  // Runner Configuration
  port: 4723,
  path: '/wd/hub',
  
  // Test Files
  specs: ['../../wdio-mocha/specs/**/*.spec.ts'],
  exclude: [],
  
  // Capabilities
  maxInstances: 1,
  
  // Test Configurations
  logLevel: 'info',
  bail: 0,
  baseUrl: 'http://localhost',
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  specFileRetries: 1,
  
  // Services
  services: [
    [
      'appium',
      {
        args: {
          address: 'localhost',
          port: 4723
        },
        logPath: './'
      }
    ]
  ],
  
  // Framework
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },
  
  // Reporters
  reporters: [
    'spec',
    [
      'junit',
      {
        outputDir: './wdio-mocha/reports/junit-results',
        outputFileFormat: function (options: any) {
          return `results-${options.cid}.xml`;
        },
      },
    ],
  ],
  
  // Hooks
  onPrepare: function (config: any, capabilities: any) {
    removeSync('./wdio-mocha/reports');
    console.log('=== onPrepare called ===');
    console.log('Config:', JSON.stringify(config, null, 2));
    console.log('Capabilities:', JSON.stringify(capabilities, null, 2));
  },
  
  beforeSession: function (config: any, capabilities: any, specs: any) {
    console.log('=== beforeSession called ===');
    console.log('Session starting with capabilities:', JSON.stringify(capabilities, null, 2));
    console.log('Specs:', specs);
  },
  
  before: async function (capabilities: any, specs: any, browser: any) {
    console.log('=== before called ===');
    console.log('Browser object:', browser);
    console.log('=== Local Appium Debug ===');
    console.log('Capabilities:', JSON.stringify(capabilities, null, 2));
  },
  
  afterSession: async function (config: any, capabilities: any, specs: any) {
    console.log('=== afterSession called ===');
    console.log('Config:', JSON.stringify(config, null, 2));
    console.log('Capabilities:', JSON.stringify(capabilities, null, 2));
    console.log('Specs:', specs);
  },
  
  after: async function (result: any, capabilities: any) {
    console.log('=== after called ===');
  },
  
  onComplete: async function (exitCode: any, config: any, capabilities: any, results: any) {
    console.log('=== onComplete called ===');
    console.log('Exit code:', exitCode);
    generateTestReports();
  },
};

// Set capabilities using type assertion
(config as any).capabilities = [
  {
    'appium:platformName': 'Android',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:deviceName': 'Pixel 6',
    'appium:platformVersion': '14',
    'appium:app': '/Users/curtisdavid/Downloads/7.45.2.apk',
    'appium:automationName': 'uiautomator2',
  }
]; 