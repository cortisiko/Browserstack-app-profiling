import { Given, When, Then } from '@cucumber/cucumber';

import FixtureBuilder from '../../e2e/fixtures/fixture-builder';
import { loadFixture, startFixtureServer } from '../../e2e/fixtures/fixture-helper';
import FixtureServer from '../../e2e/fixtures/fixture-server';
import ADB from 'appium-adb';
  const fixtureServer = new FixtureServer();


Given('I start the fixture server with login state', async function() {
  const state = new FixtureBuilder().build();
  await startFixtureServer(fixtureServer);
  await loadFixture(fixtureServer, { fixture: state });
  await driver.pause(5000);
  const bundleId = 'io.metamask.qa';

  // Check if running on BrowserStack
  const capabilities = await driver.getSession();
  const isBrowserStack = (capabilities['bstack:options']) ||
  process.argv.includes('android.config.browserstack.js')

  console.log('isBrowserStack', isBrowserStack);
  
  if (!isBrowserStack) {
    // const platform = await driver.getPlatform();

    // Only execute these steps if NOT running on BrowserStack
    if (await driver.getPlatform() === 'Android') {
      const adb = await ADB.createADB();  
      await adb.reversePort(8545, 8545);
      await adb.reversePort(12345, 12345);
    }
    await driver.terminateApp(bundleId);
    await driver.pause(1000);

    await driver.activateApp(bundleId);
    console.log('App launched, waiting for UI to stabilize...');
  } else {
    console.log('Running on BrowserStack - skipping local ADB and app management steps');
  }
});