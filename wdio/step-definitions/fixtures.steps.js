import { Given, When, Then } from '@cucumber/cucumber';

import FixtureBuilder from '../../e2e/fixtures/fixture-builder';
import { loadFixture, startFixtureServer } from '../../e2e/fixtures/fixture-helper';
import FixtureServer from '../../e2e/fixtures/fixture-server';
import ADB from 'appium-adb';

const fixtureServer = new FixtureServer();

Given('I start the fixture server with login state', async function() {
  const state = new FixtureBuilder().withProfileSyncingEnabled().build();
  
  // Start the fixture server first
  await startFixtureServer(fixtureServer);
  await loadFixture(fixtureServer, { state });
  
  // Wait for fixture server to be ready
  await driver.pause(2000);
  
  const bundleId = 'io.metamask.qa';

  // Check if running on BrowserStack
  const capabilities = await driver.getSession();
  const isBrowserStack = capabilities['bstack:options'] || 
                        process.argv.includes('android.config.browserstack.js') ||
                        process.argv.includes('ios.config.browserstack.js');

  console.log('=== Fixture Server Setup Debug ===');
  console.log('isBrowserStack:', isBrowserStack);
  console.log('BROWSERSTACK_LOCAL:', process.env.BROWSERSTACK_LOCAL);
  console.log('BROWSERSTACK_LOCAL_IDENTIFIER:', process.env.BROWSERSTACK_LOCAL_IDENTIFIER);
  console.log('GITHUB_RUN_ID:', process.env.GITHUB_RUN_ID);
  
  if (isBrowserStack) {
    console.log('Running on BrowserStack - checking tunnel status...');
    
    // For BrowserStack, we need to ensure the local tunnel is properly configured
    // The fixture server should be accessible via the tunnel
    console.log('Fixture server should be accessible via BrowserStack Local tunnel');
    console.log('Fixture server URL: http://localhost:12345/state.json');
    
    // Wait a bit longer for BrowserStack tunnel to be fully established
    await driver.pause(3000);
    
    // Verify fixture server is accessible (this will go through the tunnel)
    try {
      const response = await fetch('http://localhost:12345/state.json');
      if (response.ok) {
        console.log('✅ Fixture server is accessible via BrowserStack tunnel');
      } else {
        console.log('⚠️ Fixture server responded but with status:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Could not verify fixture server accessibility:', error.message);
    }
    
    // Test tunnel connectivity from the device's perspective
    console.log('Testing tunnel connectivity from device perspective...');
    try {
      // Use the device's network capabilities to test the connection
      const result = await driver.executeScript('mobile: shell', [
        {
          command: 'curl',
          args: ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:12345/state.json']
        }
      ]);
      
      if (result && result.includes('200')) {
        console.log('✅ Device can access fixture server through tunnel');
      } else {
        console.log('⚠️ Device cannot access fixture server through tunnel');
        console.log('Curl result:', result);
      }
    } catch (error) {
      console.log('⚠️ Could not test device tunnel connectivity:', error.message);
    }
    
    // For BrowserStack, we need to launch the app with proper launch arguments
    // that will help it connect to the fixture server through the tunnel
    console.log('Launching app with BrowserStack-specific configuration...');
    
    // Terminate and relaunch the app with proper launch arguments
    await driver.terminateApp(bundleId);
    await driver.pause(1000);
    
    // Launch the app with BrowserStack-specific launch arguments
    const launchArgs = {
      fixtureServerPort: '12345',
      // Add BrowserStack-specific environment variables
      BROWSERSTACK_LOCAL: 'true',
      BROWSERSTACK_LOCAL_IDENTIFIER: process.env.BROWSERSTACK_LOCAL_IDENTIFIER || process.env.GITHUB_RUN_ID,
      // Add any other BrowserStack-specific arguments
      detoxURLBlacklistRegex: '.*',
    };
    
    console.log('Launch arguments:', JSON.stringify(launchArgs, null, 2));
    
    // Launch the app with the specified arguments
    await driver.executeScript('mobile:launchApp', [
      {
        bundleId,
        arguments: Object.entries(launchArgs).map(([key, value]) => `${key}=${value}`),
        environment: launchArgs,
      },
    ]);
    
    console.log('✅ App launched with BrowserStack configuration');
    
  } else {
    console.log('Running locally - setting up ADB port forwarding...');
    
    // Only execute these steps if NOT running on BrowserStack
    if (await driver.getPlatform() === 'Android') {
      const adb = await ADB.createADB();  
      await adb.reversePort(8545, 8545);
      await adb.reversePort(12345, 12345);
      console.log('✅ ADB port forwarding set up for Android');
    }
    
    await driver.terminateApp(bundleId);
    await driver.pause(1000);
    await driver.activateApp(bundleId);
    console.log('✅ App launched locally, waiting for UI to stabilize...');
  }

  // Additional wait for app to stabilize
  await driver.pause(3000);
  
  // Verify that the app has loaded the fixture data
  if (isBrowserStack) {
    console.log('Verifying fixture data was loaded by the app...');
    
    // Wait a bit more for the app to fully load the fixture
    await driver.pause(2000);
    
    // Check if the app is in the expected state (logged in, etc.)
    // This is a basic check - you might want to add more specific checks based on your app
    try {
      // Look for elements that indicate the app is in the expected state
      // For example, if the fixture includes a logged-in state, look for wallet elements
      const walletElements = await driver.$$('~wallet');
      if (walletElements.length > 0) {
        console.log('✅ App appears to have loaded fixture data successfully');
      } else {
        console.log('⚠️ App may not have loaded fixture data - no wallet elements found');
      }
    } catch (error) {
      console.log('⚠️ Could not verify fixture data loading:', error.message);
    }
  }
  
  console.log('✅ Fixture server setup complete');
});