import { Given, When, Then } from '@cucumber/cucumber';

import FixtureBuilder from '../../e2e/fixtures/fixture-builder';
import { loadFixture, startFixtureServer } from '../../e2e/fixtures/fixture-helper';
import FixtureServer from '../../e2e/fixtures/fixture-server';
import ADB from 'appium-adb';
  const fixtureServer = new FixtureServer();


Given('I start the fixture server with login state', async function() {
  console.log('=== Building Fixture State ===');
  const state = new FixtureBuilder().withProfileSyncingEnabled().build();
  console.log('Fixture state built, keys:', Object.keys(state));
  console.log('Fixture state has engine:', !!state.engine);
  console.log('Fixture state has user:', !!state.user);
  console.log('Fixture state has asyncState:', !!state.asyncState);
  
  // Debug fixture state structure
  if (state.engine) {
    console.log('Engine state structure:', Object.keys(state.engine));
    if (state.engine.backgroundState) {
      console.log('Background state controllers:', Object.keys(state.engine.backgroundState));
    }
  }
  
  if (state.user) {
    console.log('User state structure:', Object.keys(state.user));
  }
  
  if (state.asyncState) {
    console.log('Async state structure:', Object.keys(state.asyncState));
  }
  
  // Get the fixture server port from utils (now returns fixed port 14939)
  let fixturePort = 14939; // fallback
  try {
    const utils = await import('../../e2e/fixtures/utils.js');
    fixturePort = utils.getFixturesServerPort();
    console.log('Fixture server port from utils:', fixturePort);
  } catch (utilsError) {
    console.log('Could not get port from utils:', utilsError.message);
  }
  
  // Check if fixture server is running before starting
  console.log('=== Checking Fixture Server Status ===');
  try {
    const statusResponse = await fetch(`http://localhost:${fixturePort}/state.json`);
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ Fixture server is already running with state:', Object.keys(status));
    } else {
      console.log('⚠️ Fixture server responded with status:', statusResponse.status);
    }
  } catch (error) {
    console.log('ℹ️ Fixture server not running yet (this is expected)');
  }
  
  // Also check bs-local.com for BrowserStack compatibility
  try {
    const bsStatusResponse = await fetch(`http://bs-local.com:${fixturePort}/state.json`);
    if (bsStatusResponse.ok) {
      const bsStatus = await bsStatusResponse.json();
      console.log('✅ Fixture server accessible via bs-local.com with state:', Object.keys(bsStatus));
    } else {
      console.log('⚠️ Fixture server via bs-local.com responded with status:', bsStatusResponse.status);
    }
  } catch (bsError) {
    console.log('ℹ️ Fixture server not accessible via bs-local.com yet (this is expected)');
  }
  
  console.log('=== Starting Fixture Server ===');
  try {
    await startFixtureServer(fixtureServer);
    console.log('✅ Fixture server started successfully');
  } catch (startError) {
    console.log('❌ Failed to start fixture server:', startError.message);
    throw startError;
  }
  
  console.log('=== Loading Fixture State ===');
  try {
    await loadFixture(fixtureServer, { state });
    console.log('✅ Fixture state loaded successfully');
  } catch (loadError) {
    console.log('❌ Failed to load fixture state:', loadError.message);
    throw loadError;
  }
  
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
    const serverStatus = fixtureServer.isRunning ? fixtureServer.isRunning() : 'method not available';
    console.log('Fixture server isRunning():', serverStatus);
  } catch (statusError) {
    console.log('Could not check fixture server status:', statusError.message);
  }
  
  // Verify fixture state is loaded by making a curl request
  console.log('=== Verifying Fixture State ===');
  try {
    const response = await fetch(`http://localhost:${fixturePort}/state.json`);
    if (response.ok) {
      const fixtureData = await response.json();
      console.log('✅ Fixture server is accessible and responding');
      console.log('Fixture state keys:', Object.keys(fixtureData));
      
      // Check if fixture data is properly loaded
      if (Object.keys(fixtureData).length === 1 && fixtureData.asyncState && Object.keys(fixtureData.asyncState).length === 0) {
        console.log('❌ WARNING: Fixture data appears to be empty! Only empty asyncState found.');
        console.log('This suggests the fixture was not loaded properly.');
      }
      
      // Log some key fixture data for debugging
      if (fixtureData.engine) {
        console.log('Engine state loaded:', !!fixtureData.engine);
        if (fixtureData.engine.backgroundState) {
          console.log('Background state keys:', Object.keys(fixtureData.engine.backgroundState));
          
          // Check if user is logged in
          if (fixtureData.engine.backgroundState.AuthenticationController) {
            console.log('Authentication state:', fixtureData.engine.backgroundState.AuthenticationController);
          }
          
          // Check if accounts exist
          if (fixtureData.engine.backgroundState.AccountsController) {
            console.log('Accounts state:', fixtureData.engine.backgroundState.AccountsController);
          }
          
          // Check if preferences exist
          if (fixtureData.engine.backgroundState.PreferencesController) {
            console.log('Preferences state:', fixtureData.engine.backgroundState.PreferencesController);
          }
        }
      }
      
      if (fixtureData.user) {
        console.log('User state loaded:', fixtureData.user);
        console.log('User logged in:', fixtureData.user.userLoggedIn);
        console.log('Password set:', fixtureData.user.passwordSet);
        console.log('Seedphrase backed up:', fixtureData.user.seedphraseBackedUp);
      }
      
      if (fixtureData.asyncState) {
        console.log('Async state loaded:', fixtureData.asyncState);
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
    console.log(`  2. Port ${fixturePort} is blocked`);
    console.log('  3. BrowserStack tunnel is not working');
  }
  
  // Also check bs-local.com for BrowserStack compatibility
  try {
    const bsResponse = await fetch(`http://bs-local.com:${fixturePort}/state.json`);
    if (bsResponse.ok) {
      const bsFixtureData = await bsResponse.json();
      console.log('✅ Fixture server accessible via bs-local.com');
      console.log('bs-local.com fixture state keys:', Object.keys(bsFixtureData));
    } else {
      console.log('⚠️ bs-local.com fixture server responded with status:', bsResponse.status);
    }
  } catch (bsError) {
    console.log('❌ Could not access fixture server via bs-local.com:', bsError.message);
  }
  
  // Test fixture server accessibility from device perspective
  console.log('=== Testing Fixture Server from Device ===');
  try {
    // Get platform using BrowserStack-compatible method
    let platform = 'Android'; // default
    try {
      const session = await driver.getSession();
      platform = session.platformName || session.platform || 'Android';
    } catch (sessionError) {
      console.log('Could not get session info, using default platform:', sessionError.message);
    }
    console.log('Device platform:', platform);
    
    if (platform === 'Android') {
      // For Android, use ADB shell curl to test from device perspective
      const adb = await ADB.createADB();
      
      // Test if we can reach the fixture server from the device
      console.log('Testing fixture server from Android device...');
      
      // Try to curl the fixture server from the device
      const curlResult = await adb.shell(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${fixturePort}/state.json`);
      console.log('Device curl result:', curlResult);
      
      if (curlResult.trim() === '200') {
        console.log('✅ Device can access fixture server (HTTP 200)');
      } else {
        console.log(`⚠️ Device curl returned: ${curlResult.trim()}`);
      }
      
      // Also try to get the actual response
      try {
        const responseData = await adb.shell(`curl -s http://localhost:${fixturePort}/state.json`);
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
  
  // Restart the app with the correct fixture server port
  console.log('=== Restarting App with Fixture Server Port ===');
  console.log(`Using fixture server port: ${fixturePort}`);
  

    

  
  // Wait for fixture server to be ready
  await driver.pause(3000);
  console.log('App launch completed');
  
  // Verify app can access fixture server after restart
  console.log('=== Verifying App Access to Fixture Server ===');
  try {
    // Test if the app can access the fixture server through the tunnel
    let platform = 'Android'; // default
    try {
      const session = await driver.getSession();
      platform = session.platformName || session.platform || 'Android';
    } catch (sessionError) {
      console.log('Could not get session info, using default platform:', sessionError.message);
    }
    
    if (platform === 'Android') {
      const adb = await ADB.createADB();
      
      // Test fixture server access from device after app restart
      const curlResult = await adb.shell(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${fixturePort}/state.json`);
      console.log('Device curl result after app restart:', curlResult);
      
      if (curlResult.trim() === '200') {
        console.log('✅ Device can still access fixture server after app restart');
        
        // Get the actual fixture data from device perspective
        const responseData = await adb.shell(`curl -s http://localhost:${fixturePort}/state.json`);
        console.log('Device fixture data after restart (first 200 chars):', responseData.substring(0, 200));
      } else {
        console.log(`❌ Device cannot access fixture server after app restart: ${curlResult.trim()}`);
      }
    }
  } catch (verificationError) {
    console.log('❌ Could not verify app access to fixture server:', verificationError.message);
  }
});