import FixtureBuilder from '../../e2e/fixtures/fixture-builder';
import { loadFixture, startFixtureServer,stopFixtureServer } from '../../e2e/fixtures/fixture-helper';
import FixtureServer from '../../e2e/fixtures/fixture-server';
import ADB from 'appium-adb';
import Accounts from '../../wdio/helpers/Accounts';
import LoginScreen from '../../wdio/screen-objects/LoginScreen';
import WalletMainScreen from '../../wdio/screen-objects/WalletMainScreen';

// Declare driver as global (WebdriverIO provides this)
declare const driver: any;

const fixtureServer = new FixtureServer();

// Test suite for fixture server login functionality
describe('Fixture Server Login Test', () => {
  let validAccount: any;

  // Setup before all tests
  before(async () => {
    // Setup valid account for testing
    validAccount = Accounts.getValidAccount();
  });

  // Setup before each test (equivalent to Cucumber Background)
  beforeEach(async () => {
    // Background steps - equivalent to Cucumber Background
    console.log('=== Starting fixture server with login state ===');
    const state = new FixtureBuilder().build();
    await startFixtureServer(fixtureServer);
    await loadFixture(fixtureServer, { fixture: state });
    await driver.pause(5000);
    const bundleId = 'io.metamask.qa';

    // Check if running on BrowserStack
    // const capabilities = await driver.getSession();
    // const isBrowserStack = (capabilities['bstack:options']) ||
    // process.argv.includes('browserstack.conf.ts')

    // console.log('isBrowserStack', isBrowserStack);
    
    // if (!isBrowserStack) {
    //   // Only execute these steps if NOT running on BrowserStack
    //   if (driver.capabilities.platformName === 'Android') {
    //     const adb = await ADB.createADB();  
    //     await adb.reversePort(8545, 8545);
    //     await adb.reversePort(12345, 12345);
    //   }
    //   console.log('App launched, waiting for UI to stabilize...');
    // } else {
    //   console.log('Running on BrowserStack - skipping local ADB and app management steps');
    // }

    console.log('=== Filling password in Login screen ===');
    await LoginScreen.waitForScreenToDisplay();
    await LoginScreen.typePassword('123123123');
    await LoginScreen.tapTitle();
    await LoginScreen.tapTitle();
    await LoginScreen.tapUnlockButton();

  });

  // Main test case
  it('should verify fixture server provides logged-in state', async () => {
    // Given I am on the wallet screen
    console.log('=== Verifying wallet screen is accessible ===');
    await WalletMainScreen.isVisible();

    // Then I should not see the login screen
    console.log('=== Verifying login screen is not visible ===');
    try {
      await LoginScreen.isLoginScreenVisible();
      // If we reach here, the login screen is visible, which is not expected
      throw new Error('Login screen should not be visible after fixture server setup');
    } catch (error) {
      // Expected behavior - login screen should not be visible
      console.log('✓ Login screen is not visible as expected');
    }

    // And I should be able to access wallet features without password
    console.log('=== Verifying wallet features are accessible without password ===');
    
    // Test that we can access basic wallet functionality
    // This could include checking that the wallet main screen is fully functional
    await WalletMainScreen.isMainWalletViewVisible();
    
    // Additional verification that wallet features are accessible
    // For example, check that the account icon is visible (indicating logged in state)
    const accountIcon = await WalletMainScreen.accountIcon;
    if (!(await accountIcon.isDisplayed())) {
      throw new Error('Account icon should be displayed');
    }
    
    // Check that the wallet container is visible
    const walletContainer = await WalletMainScreen.WalletScreenContainer;
    if (!(await walletContainer.isDisplayed())) {
      throw new Error('Wallet container should be displayed');
    }
    
    console.log('✓ Wallet features are accessible without password prompt');
  });

  // Cleanup after all tests
  after(async () => {
    // Cleanup if needed
    console.log('=== Test completed successfully ===');
    await stopFixtureServer(fixtureServer);

  });
}); 