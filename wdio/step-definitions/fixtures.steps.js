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
    
  } else {
    console.log('Running locally - setting up ADB port forwarding...');
    
    // Only execute these steps if NOT running on BrowserStack
    // if (await driver.getPlatform() === 'Android') {
    //   const adb = await ADB.createADB();  
    //   await adb.reversePort(8545, 8545);
    //   await adb.reversePort(12345, 12345);
    //   console.log('✅ ADB port forwarding set up for Android');
    // }
    
    await driver.terminateApp(bundleId);
    await driver.pause(1000);
    await driver.activateApp(bundleId);
    console.log('✅ App launched locally, waiting for UI to stabilize...');
  }

  // Additional wait for app to stabilize
  await driver.pause(3000);
  console.log('✅ Fixture server setup complete');
});