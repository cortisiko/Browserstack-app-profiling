import * as dotenv from 'dotenv';
import { removeSync } from 'fs-extra';
import type { Options } from '@wdio/types';

dotenv.config({ path: '.e2e.env' });
 
// Import your utilities
import generateTestReports from './wdio/utils/generateTestReports.js';
import { gasApiDown, cleanAllMocks } from './wdio/utils/mocks.js';
import {
  startGanache,
  stopGanache,
  deployMultisig,
  deployErc20,
  deployErc721,
} from './wdio/utils/ganache.js';
import FixtureBuilder from './e2e/fixtures/fixture-builder.js';
import { loadFixture, startFixtureServer, stopFixtureServer } from './e2e/fixtures/fixture-helper.js';
import FixtureServer from './e2e/fixtures/fixture-server.js';

const fixtureServer = new FixtureServer();

// cucumber tags
const GANACHE = '@ganache';
const MULTISIG = '@multisig';
const ERC20 = '@erc20';
const ERC721 = '@erc721';
const GAS_API_DOWN = '@gasApiDown';
const MOCK = '@mock';
const FIXTURES_SKIP_ONBOARDING = '@fixturesSkipOnboarding';

export const config: Options.Testrunner = {
  //
  // ====================
  // Runner Configuration
  // ====================
  //
  port: 4723,
  path: 'wd/hub',
  //
  // ==================
  // Specify Test Files
  // ==================
  // Define which test specs should run. The pattern is relative to the directory
  // from which `wdio` was called.
  //
  // The specs are defined as an array of spec files (optionally using wildcards
  // that will be expanded). The test for each spec file will be run in a separate
  // worker process. In order to have a group of spec files run in the same worker
  // process simply enclose them in an array within the specs array.
  //
  // If you are calling `wdio` from an NPM script (see https://docs.npmjs.com/cli/run-script),
  // then the current working directory is where your `package.json` resides, so `wdio`
  // will be called from there.
  //
  specs: ['./wdio/features/**/*.feature'],

  suites: {
    confirmations: ['./wdio/features/Confirmations/*.feature'],
  },

  // Patterns to exclude.
  exclude: [
    './wdio/features/Wallet/*',
    './wdio/features/Accounts/*',
    './wdio/features/BrowserFlow/*',
    './wdio/features/Confirmations/*',
    './wdio/features/Networks/*',
    './wdio/features/Settings/*',
    './wdio/features/SecurityAndPrivacy/*',
    './wdio/features/Onboarding/*',
  ],
  //
  // ============
  // Capabilities
  // ============
  // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
  // time. Depending on the number of capabilities, WebdriverIO launches several test
  // sessions. Within your capabilities you can overwrite the spec and exclude options in
  // order to group specific specs to a specific capability.
  //
  // First, you can define how many instances should be started at the same time. Let's
  // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
  // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
  // files and you set maxInstances to 10, all spec files will get tested at the same time
  // and 30 processes will get spawned. The property handles how many capabilities
  // from the same test should run tests.
  //
  maxInstances: 10,
  specFileRetries: 1,
  //
  // If you have trouble getting all important capabilities together, check out the
  // Sauce Labs platform configurator - a great tool to configure your capabilities:
  // https://saucelabs.com/platform/platform-configurator
  //
  // capabilities: [
  //   {
  //     /***
  //      // maxInstances can get overwritten per capability. So if you have an in-house Selenium
  //      // grid with only 5 firefox instances available you can make sure that not more than
  //      // 5 instances get started at a time.
  //      maxInstances: 5,
  //      //
  //      browserName: 'chrome',
  //      acceptInsecureCerts: true
  //      // If outputDir is provided WebdriverIO can capture driver session logs
  //      // it is possible to configure which logTypes to include/exclude.
  //      // excludeDriverLogs: ['*'], // pass '*' to exclude all driver session logs
  //      // excludeDriverLogs: ['bugreport', 'server'],
  //      platformName: "Android",
  //      platformVersion: "10",
  //      deviceName: "Pixel 3 API 29",
  //      app: "/Users/chriswilcox/projects/wdio/resources/ApiDemos-debug.apk",
  //      // app: __dirname + "/projects/wdio/resources/ApiDemos-debug.apk",
  //      appPackage: "io.appium.android.apis",
  //      appActivity: ".view.TextFields",
  //      automationName: "UiAutomator2"
  //      ***/
  //   },
  // ],
  //
  // ===================
  // Test Configurations
  // ===================
  // Define all options that are relevant for the WebdriverIO instance here
  //
  // Level of logging verbosity: trace | debug | info | warn | error | silent
  logLevel: 'info',
  //
  // Set specific log levels per logger
  // loggers:
  // - webdriver, webdriverio
  // - @wdio/browserstack-service, @wdio/devtools-service, @wdio/sauce-service
  // - @wdio/mocha-framework, @wdio/jasmine-framework
  // - @wdio/local-runner
  // - @wdio/sumologic-reporter
  // - @wdio/cli, @wdio/config, @wdio/utils
  // Level of logging verbosity: trace | debug | info | warn | error | silent
  // logLevels: {
  //     webdriver: 'info',
  //     '@wdio/appium-service': 'info'
  // },
  //
  // If you only want to run your tests until a specific amount of tests have failed use
  // bail (default is 0 - don't bail, run all tests).
  bail: 0,
  //
  // Set a base URL in order to shorten url command calls. If your `url` parameter starts
  // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
  // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
  // gets prepended directly.
  baseUrl: 'http://localhost',
  //
  // Default timeout for all waitFor* commands.
  waitforTimeout: 40000,
  //
  // Default timeout in milliseconds for request
  // if browser driver or grid doesn't send response
  connectionRetryTimeout: 120000,
  //
  // Default request retries count
  connectionRetryCount: 3,
  //
  // Test runner services
  // Services take over a specific job you don't want to take care of. They enhance
  // your test setup with almost no effort. Unlike plugins, they don't add new
  // commands. Instead, they hook themselves up into the test process.
  /** services: ['chromedriver','appium'], ***/
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

  // Appium service with custom chrome driver path
  /*services: [
    ['appium', {
      args: {
        chromedriverExecutable: '',
      }
    }]
  ],*/
  // Framework you want to run your specs with.
  // The following are supported: Mocha, Jasmine, and Cucumber
  // see also: https://webdriver.io/docs/frameworks
  //
  // Make sure you have the wdio adapter package for the specific framework installed
  // before running any tests.
  framework: 'cucumber',
  //
  // The number of times to retry the entire specfile when it fails as a whole
  // specFileRetries: 1,
  //
  // Delay in seconds between the spec file retry attempts
  // specFileRetriesDelay: 0,
  //
  // Whether or not retried specfiles should be retried immediately or deferred to the end of the queue
  // specFileRetriesDeferred: false,
  //
  // Test reporter for stdout.
  // The only one supported by default is 'dot'
  // see also: https://webdriver.io/docs/dot-reporter
  reporters: [
    'spec',
    // [
    //   'cucumberjs-json',
    //   {
    //     jsonFolder: './wdio/reports/json',
    //     language: 'en',
    //   },
    // ],
    [
      'junit',
      {
        outputDir: './wdio/reports/junit-results',
        outputFileFormat: function (options: any) {
          // optional
          return `results-${options.cid}.${options.capabilities.platformName}.xml`;
        },
      },
    ],
  ],

  //
  // If you are using Cucumber you need to specify the location of your step definitions.
  cucumberOpts: {
    // <string[]> (file/dir) require files before executing features
    require: ['./wdio/step-definitions/*.js'],
    // <boolean> show full backtrace for errors
    backtrace: false,
    // <string[]> ("extension:module") require files with the given EXTENSION after requiring MODULE (repeatable)
    requireModule: [],
    // <boolean> invoke formatters without executing steps
    dryRun: false,
    // <boolean> abort the run on first failure
    failFast: false,
    // <boolean> hide step definition snippets for pending steps
    snippets: true,
    // <boolean> hide source uris
    source: true,
    // <boolean> fail if there are any undefined or pending steps
    strict: false,
    // <string> (expression) only execute the features or scenarios with tags matching the expression
    tags: '',
    // <number> timeout for step definitions
    timeout: 200000,
    // <boolean> Enable this config to treat undefined definitions as warnings.
    ignoreUndefinedDefinitions: false,
    // WDIO v9+ Cucumber hooks:
    beforeScenario: async function (world: any, context: any) {
      const tags = world.pickle.tags;
      
      // Check if scenario has @temp tag - if not, skip it
      const hasTempTag = tags.some((tag: any) => tag.name === '@temp');
      if (!hasTempTag) {
        console.log(`Skipping scenario: ${world.pickle.name} - no @temp tag found`);
        // Skip this scenario by throwing a special error that Cucumber will handle
        throw new Error('SKIP_SCENARIO');
      }

      if (tags.filter((e: any) => e.name === FIXTURES_SKIP_ONBOARDING).length > 0) {
        // Start the fixture server
        await startFixtureServer(fixtureServer);
        const state = new FixtureBuilder().build();
        await loadFixture(fixtureServer, { fixture: state });
      }
    },
    afterScenario: async function (world: any, context: any) {
      const tags = world.pickle.tags;

    //   if (tags.filter((e: any) => e.name === GANACHE).length > 0) {
    //     await stopGanache();
    //   }

      if (tags.filter((e: any) => e.name === MOCK).length > 0) {
        cleanAllMocks();
      }
    },
  },

  //
  // =====
  // Hooks
  // =====
  // WebdriverIO provides several hooks you can use to interfere with the test process in order to enhance
  // it and to build services around it. You can either apply a single function or an array of
  // methods to it. If one of them returns with a promise, WebdriverIO will wait until that promise got
  // resolved to continue.
  /**
   * Gets executed once before all workers get launched.
   * @param {Object} config wdio configuration object
   * @param {Array.<Object>} capabilities list of capabilities details
   */
  onPrepare: function (config: any, capabilities: any) {
    removeSync('./wdio/reports');
  },
  /**
   * Gets executed before a worker process is spawned and can be used to initialise specific service
   * for that worker as well as modify runtime environments in an async fashion.
   * @param  {String} cid      capability id (e.g 0-0)
   * @param  {[type]} caps     object containing capabilities for session that will be spawn in the worker
   * @param  {[type]} specs    specs to be run in the worker process
   * @param  {[type]} args     object that will be merged with the main configuration once worker is initialized
   * @param  {[type]} execArgv list of string arguments passed to the worker process
   */
  // onWorkerStart: function (cid, caps, specs, args, execArgv) {
  // },
  /**
   * Gets executed just after a worker process has exited.
   * @param  {String} cid      capability id (e.g 0-0)
   * @param  {Number} exitCode 0 - success, 1 - fail
   * @param  {[type]} specs    specs to be run in the worker process
   * @param  {Number} retries  number of retries used
   */
  // onWorkerEnd: function (cid, exitCode, specs, retries) {
  // },
  /**
   * Gets executed just before initialising the webdriver session and test framework. It allows you
   * to manipulate configurations depending on the capability or spec.
   * @param {Object} config wdio configuration object
   * @param {Array.<Object>} capabilities list of capabilities details
   * @param {Array.<String>} specs List of spec file paths that are to be run
   * @param {String} cid worker id (e.g. 0-0)
   */
  // beforeSession: function (config, capabilities, specs, cid) {
  // },
  /**
   * Gets executed before test execution begins. At this point you can access to all global
   * variables like `browser`. It is the perfect place to define custom commands.
   * @param {Array.<Object>} capabilities list of capabilities details
   * @param {Array.<String>} specs        List of spec file paths that are to be run
   * @param {Object}         browser      instance of created browser/device session
   */
  before: async function (capabilities: any) {
    (global as any).driver.getPlatform = function getPlatform() {
      return capabilities.platformName;
    };
    const fixture = new FixtureBuilder().withProfileSyncingEnabled().build();
    await startFixtureServer(fixtureServer);
    await loadFixture(fixtureServer, { fixture });    

    // if (await driver.getPlatform() === 'Android') {
    //   const adb = await ADB.createADB();
    //   await adb.reversePort(8545, 8545);
    //   await adb.reversePort(12345, 12345);
    // }

    
  },
  /**
   * Runs before a WebdriverIO command gets executed.
   * @param {String} commandName hook command name
   * @param {Array} args arguments that command would receive
   */
  // beforeCommand: function (commandName, args) {
  // },
  /**
   *
   * Runs after a Cucumber Scenario.
   * @param {ITestCaseHookParameter} world            world object containing information on pickle and test step
   * @param {Object}                 result           results object containing scenario results
   * @param {boolean}                result.passed    true if scenario has passed
   * @param {string}                 result.error     error stack if scenario failed
   * @param {number}                 result.duration  duration of scenario in milliseconds
   * @param {Object}                 context          Cucumber World object
   */
  // afterStep: function (step, scenario, result, context) {
  // },
  /**
   * Gets executed after all tests are done. You still have access to all global variables from
   * the test.
   * @param {Number} result 0 - test pass, 1 - test fail
   * @param {Array.<Object>} capabilities list of capabilities details
   * @param {Array.<String>} specs List of spec file paths that ran
   */
  after: async function (result: any, capabilities: any) {
    // Stop the fixture server
    await stopFixtureServer(fixtureServer);

    if (capabilities.bundleId) {
      (global as any).driver.terminateApp(capabilities.bundleId);
    }
  },
  /**
   * Gets executed right after terminating the webdriver session.
   * @param {Object} config wdio configuration object
   * @param {Array.<Object>} capabilities list of capabilities details
   * @param {Array.<String>} specs List of spec file paths that ran
   */
  // afterSession: function (config, capabilities, specs) {
  // },
  /**
   * Gets executed after all workers got shut down and the process is about to exit. An error
   * thrown in the onComplete hook will result in the test run failing.
   * @param {Object} exitCode 0 - success, 1 - fail
   * @param {Object} config wdio configuration object
   * @param {Array.<Object>} capabilities list of capabilities details
   * @param {<Object>} results object containing test results
   */
  onComplete: async function (exitCode: any, config: any, capabilities: any) {
    generateTestReports();
  },
  /**
   * Gets executed when a refresh happens.
   * @param {String} oldSessionId session ID of the old session
   * @param {String} newSessionId session ID of the new session
   */
  // onReload: function(oldSessionId, newSessionId) {
  // }
}; 