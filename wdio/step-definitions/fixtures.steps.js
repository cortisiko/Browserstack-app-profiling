import { Given, When, Then } from '@cucumber/cucumber';

import FixtureBuilder from '../../e2e/fixtures/fixture-builder';
import { loadFixture, startFixtureServer } from '../../e2e/fixtures/fixture-helper';
import FixtureServer from '../../e2e/fixtures/fixture-server';
import ADB from 'appium-adb';
  const fixtureServer = new FixtureServer();


Given('I start the fixture server with login state', async function() {
  const state = new FixtureBuilder().withProfileSyncingEnabled().build();
  
  // Check if fixture server is running before starting
  console.log('=== Checking Fixture Server Status ===');
  try {
    const statusResponse = await fetch('http://localhost:12345/state.json');
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ Fixture server is already running with state:', Object.keys(status));
    } else {
      console.log('⚠️ Fixture server responded with status:', statusResponse.status);
    }
  } catch (error) {
    console.log('ℹ️ Fixture server not running yet (this is expected)');
  }
  
  await startFixtureServer(fixtureServer);
  await loadFixture(fixtureServer, { state });
  await driver.pause(5000);
  const bundleId = 'io.metamask.qa';

  // Check if running on BrowserStack
  const capabilities = await driver.getSession();
  const isBrowserStack = (capabilities['bstack:options']) ||
  process.argv.includes('android.config.browserstack.js')

  console.log('isBrowserStack', isBrowserStack);
  
  // Additional debugging for fixture server
  console.log('=== Fixture Server Debug Info ===');
  console.log('Fixture server instance:', !!fixtureServer);
  console.log('Fixture server port:', fixtureServer.port || 'unknown');
  console.log('Fixture server URL:', fixtureServer.url || 'unknown');
  
  // Check if fixture server is actually running
  try {
    const serverStatus = await fixtureServer.isRunning();
    console.log('Fixture server isRunning():', serverStatus);
  } catch (statusError) {
    console.log('Could not check fixture server status:', statusError.message);
  }
  
  // Try to get the actual port being used
  try {
    const utils = await import('../../e2e/fixtures/utils.js');
    const port = utils.getFixturesServerPort();
    console.log('Fixture server port from utils:', port);
  } catch (utilsError) {
    console.log('Could not get port from utils:', utilsError.message);
  }
  
  // Verify fixture state is loaded by making a curl request
  console.log('=== Verifying Fixture State ===');
  try {
    const response = await fetch('http://localhost:12345/state.json');
    if (response.ok) {
      const fixtureData = await response.json();
      console.log('✅ Fixture server is accessible and responding');
      console.log('Fixture state keys:', Object.keys(fixtureData));
      
      // Log some key fixture data for debugging
      if (fixtureData.engine) {
        console.log('Engine state loaded:', !!fixtureData.engine);
      }
      if (fixtureData.metamask) {
        console.log('MetaMask state loaded:', !!fixtureData.metamask);
        if (fixtureData.metamask.identities) {
          const identityCount = Object.keys(fixtureData.metamask.identities).length;
          console.log(`Number of identities: ${identityCount}`);
        }
      }
      if (fixtureData.permissions) {
        console.log('Permissions state loaded:', !!fixtureData.permissions);
      }
      
      // Log a sample of the fixture data (first 500 chars)
      const fixturePreview = JSON.stringify(fixtureData).substring(0, 500);
      console.log('Fixture data preview:', fixturePreview + '...');
    } else {
      console.log('⚠️ Fixture server responded with status:', response.status);
    }
  } catch (error) {
    console.log('❌ Could not access fixture server:', error.message);
    console.log('This might indicate:');
    console.log('  1. Fixture server is not running');
    console.log('  2. Port 12345 is blocked');
    console.log('  3. BrowserStack tunnel is not working');
  }
  
  // Test fixture server accessibility from device perspective
  console.log('=== Testing Fixture Server from Device ===');
  try {
    // Get platform using the correct method
    const capabilities = await driver.getAppiumSessionCapabilities();
    const platform = capabilities.platformName || capabilities.platform;
    console.log('Device platform:', platform);
    
    if (platform === 'Android') {
      // For Android, use ADB shell curl to test from device perspective
      const adb = await ADB.createADB();
      
      // Test if we can reach the fixture server from the device
      console.log('Testing fixture server from Android device...');
      
      // Try to curl the fixture server from the device
      const curlResult = await adb.shell('curl -s -o /dev/null -w "%{http_code}" http://localhost:12345/state.json');
      console.log('Device curl result:', curlResult);
      
      if (curlResult.trim() === '200') {
        console.log('✅ Device can access fixture server (HTTP 200)');
      } else {
        console.log(`⚠️ Device curl returned: ${curlResult.trim()}`);
      }
      
      // Also try to get the actual response
      try {
        const responseData = await adb.shell('curl -s http://localhost:12345/state.json');
        console.log('Device fixture server response:', responseData);
      } catch (curlError) {
        console.log('Could not get response data from device:', curlError.message);
      }
    } else {
      console.log('iOS device - skipping device curl test (would need different approach)');
    }
  } catch (deviceError) {
    console.log('❌ Could not test fixture server from device:', deviceError.message);
  }
  
  // if (!isBrowserStack) {
  //   // const platform = await driver.getPlatform();

  //   // Only execute these steps if NOT running on BrowserStack
  //   if (await driver.getPlatform() === 'Android') {
  //     const adb = await ADB.createADB();  
  //     await adb.reversePort(8545, 8545);
  //     await adb.reversePort(12345, 12345);
  //   }
  //   await driver.terminateApp(bundleId);
  //   await driver.pause(1000);

  //   await driver.activateApp(bundleId);
  //   console.log('App launched, waiting for UI to stabilize...');
  // } else {
  //   console.log('Running on BrowserStack - skipping local ADB and app management steps');
  // }

  // if (await driver.getPlatform() === 'iOS') {

  // console.log('Re-launching MetaMask on iOS...');
  // await driver.executeScript('mobile:launchApp', [
  //   {
  //     bundleId,
  //     arguments: ['fixtureServerPort', '12345'],
  //     environment: {
  //       fixtureServerPort: `${'12345'}`,
  //     },
  //   },
  // ]);
  // Wait for fixture server to be ready
});