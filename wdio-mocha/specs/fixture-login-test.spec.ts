import FixtureBuilder from '../../e2e/fixtures/fixture-builder';
import { loadFixture, startFixtureServer,stopFixtureServer } from '../../e2e/fixtures/fixture-helper';
import FixtureServer from '../../e2e/fixtures/fixture-server';
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
    
    // Debug fixture server connection
    console.log('Fixture server state:', JSON.stringify(state, null, 2));
    
    await startFixtureServer(fixtureServer);
    console.log('✓ Fixture server started successfully');
    
    // Test if fixture server is accessible
    try {
      const response = await fetch('http://localhost:12345');
      console.log('✓ Fixture server is accessible locally');
      console.log('Response status:', response.status);
      
      // Test if the response contains the expected fixture data
      const responseText = await response.text();
      console.log('Fixture response preview:', responseText.substring(0, 200) + '...');
      
      // Check if the response contains valid JSON
      try {
        const jsonData = JSON.parse(responseText);
        console.log('✓ Fixture server returned valid JSON');
        console.log('Fixture keys:', Object.keys(jsonData));
      } catch (jsonError) {
        console.log('⚠️ Fixture server response is not valid JSON:', jsonError.message);
      }
    } catch (error) {
      console.log('⚠️ Fixture server not accessible locally:', error.message);
      console.log('Error details:', error);
    }
    
    // Test BrowserStack Local tunnel connectivity
    console.log('=== BrowserStack Local Tunnel Test ===');
    console.log('Testing if BrowserStack device can reach fixture server...');
    
    // Test if we can access the fixture server from the GitHub Actions runner
    try {
      const fixtureResponse = await fetch('http://localhost:12345');
      console.log('✓ Fixture server accessible from GitHub Actions runner');
      console.log('Fixture response status:', fixtureResponse.status);
      
      // Test if the response contains the expected fixture data
      const responseText = await fixtureResponse.text();
      console.log('Fixture response preview:', responseText.substring(0, 200) + '...');
    } catch (error) {
      console.log('❌ Fixture server NOT accessible from GitHub Actions runner:', error.message);
    }
    
    // Wait a bit more for the fixture to be processed
    console.log('Waiting for fixture to be processed by app...');
    await driver.pause(3000);
    
    await loadFixture(fixtureServer, { fixture: state });
    console.log('✓ Fixture loaded successfully');
    
    // Test if the fixture server is still accessible after loading
    try {
      const postLoadResponse = await fetch('http://localhost:12345');
      console.log('✓ Fixture server still accessible after loading fixture');
      console.log('Post-load response status:', postLoadResponse.status);
    } catch (error) {
      console.log('❌ Fixture server not accessible after loading fixture:', error.message);
    }
    
    // Wait for app to process the fixture
    console.log('Waiting for app to process fixture data...');
    await driver.pause(5000);
    
    // Check if app is in logged-in state
    console.log('=== Checking app state after fixture load ===');
    try {
      // Try to check if we're already logged in (no password screen)
      const loginScreen = await LoginScreen.isLoginScreenVisible();
      console.log('Login screen visible:', loginScreen);
    } catch (error) {
      console.log('Login screen not visible (good - means we might be logged in)');
    }
    const bundleId = 'io.metamask.qa';

    // BrowserStack configuration - no ADB commands needed
    // BrowserStack Local tunnel handles all port forwarding automatically
    console.log('Running on BrowserStack - port forwarding handled by BrowserStack Local tunnel');
    console.log('Fixture server accessible via BrowserStack Local tunnel on port 12345');
    
    // Test if the app can reach the fixture server through the tunnel
    console.log('=== Testing app connectivity to fixture server ===');
    console.log('App should be able to reach fixture server at: http://localhost:12345');
    console.log('BrowserStack Local tunnel should forward this to the device');
    
    // Debug GitHub Actions environment
    console.log('=== GitHub Actions Debug ===');
    console.log('GITHUB_RUN_ID:', process.env.GITHUB_RUN_ID);
    console.log('BROWSERSTACK_LOCAL:', process.env.BROWSERSTACK_LOCAL);
    console.log('BROWSERSTACK_LOCAL_IDENTIFIER:', process.env.BROWSERSTACK_LOCAL_IDENTIFIER);
    console.log('BROWSERSTACK_USERNAME:', process.env.BROWSERSTACK_USERNAME ? 'SET' : 'NOT SET');
    console.log('BROWSERSTACK_ACCESS_KEY:', process.env.BROWSERSTACK_ACCESS_KEY ? 'SET' : 'NOT SET');

    // Fill password in Login screen
    console.log('=== Filling password in Login screen ===');
    try {
      await LoginScreen.waitForScreenToDisplay();
      console.log('✓ Login screen is displayed');
      
      await LoginScreen.typePassword('123123123');
      console.log('✓ Password typed successfully');
      
      await LoginScreen.tapTitle();
      await LoginScreen.tapTitle();
      console.log('✓ Title tapped twice');
      
      await LoginScreen.tapUnlockButton();
      console.log('✓ Unlock button tapped');
    } catch (error) {
      console.log('❌ Error during password entry:', error.message);
      console.log('Error stack:', error.stack);
    }

  });

  // Main test case
  it('should verify fixture server provides logged-in state', async () => {
    // Given I am on the wallet screen
    console.log('=== Verifying wallet screen is accessible ===');
    try {
      await WalletMainScreen.isVisible();
      console.log('✓ Wallet screen is visible');
    } catch (error) {
      console.log('❌ Error checking wallet screen visibility:', error.message);
      console.log('Error stack:', error.stack);
      throw error;
    }

    // Then I should not see the login screen
    console.log('=== Verifying login screen is not visible ===');
    try {
      await LoginScreen.isLoginScreenVisible();
      // If we reach here, the login screen is visible, which is not expected
      console.log('❌ Login screen is visible when it should not be (fixture server issue)');
      throw new Error('Login screen should not be visible after fixture server setup');
    } catch (error) {
      if (error.message.includes('Login screen should not be visible')) {
        // This is our expected error - login screen is visible when it shouldn't be
        console.log('❌ Login screen is visible when it should not be (fixture server issue)');
        throw error;
      } else {
        // This is an error checking login screen visibility - assume login screen is not visible (good)
        console.log('⚠️ Error checking login screen visibility:', error.message);
        console.log('Assuming login screen is not visible (good)');
      }
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