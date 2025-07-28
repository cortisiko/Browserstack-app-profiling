import { removeSync } from 'fs-extra';
import type { Options } from '@wdio/types';
import generateTestReports from '../../wdio/utils/generateTestReports';

export const config: Options.Testrunner = {
  port: 4723,
  path: '/',
  
  specs: ['../../wdio-mocha/specs/**/*.spec.ts'],
  exclude: [],
  
  maxInstances: 1,
  
  logLevel: 'info',
  bail: 0,
  baseUrl: 'http://localhost',
  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,
  specFileRetries: 1,
  

  
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },
  
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
  
  onPrepare: function (config: any, capabilities: any) {

  },
  
  beforeSession: function (config: any, capabilities: any, specs: any) {

  },
  
  before: async function (capabilities: any, specs: any, browser: any) {

  },
  
  afterSession: async function (config: any, capabilities: any, specs: any) {

  },
  
  after: async function (result: any, capabilities: any) {
    console.log('=== after called ===');
  },
  
  onComplete: async function (exitCode: any, config: any, capabilities: any, results: any) {
    // console.log('=== onComplete called ===');
    // console.log('Exit code:', exitCode);
    // generateTestReports();
  },
};

