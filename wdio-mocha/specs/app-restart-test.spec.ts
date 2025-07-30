import FixtureBuilder from "../../e2e/fixtures/fixture-builder";
import {
  loadFixture,
  startFixtureServer,
  stopFixtureServer,
} from "../../e2e/fixtures/fixture-helper";
import FixtureServer from "../../e2e/fixtures/fixture-server";
import ADB from "appium-adb";
import Accounts from "../../wdio/helpers/Accounts";
import LoginScreen from "../../wdio/screen-objects/LoginScreen";
import WalletMainScreen from "../../wdio/screen-objects/WalletMainScreen";
import { ensureBrowserStackLocalAccess } from "../utils/browserstack-tunnel-helper";

declare const driver: any;

const fixtureServer = new FixtureServer();
const BUNDLE_ID = "io.metamask.qa";

describe("App Restart Test", () => {
  let validAccount: any;

  before(async () => {
    validAccount = Accounts.getValidAccount();

    const state = new FixtureBuilder().withGanacheNetwork().withChainPermission().build();
    
    const isBrowserStackCI = process.env.BROWSERSTACK_CI === 'true';
    
        // if (!isBrowserStackCI) {
    //   console.log("🔄 Starting fixture server (not on BrowserStack CI)");
    //   await startFixtureServer(fixtureServer);
    //   await loadFixture(fixtureServer, { fixture: state });
    // } else {
    //   console.log("✅ Using existing fixture server from CI");
    //   fixtureServer.loadJsonState(state);
    // }
    await startFixtureServer(fixtureServer);
    await loadFixture(fixtureServer, { fixture: state });
      
    await driver.pause(5000);
  });

  after(async () => {
    await stopFixtureServer(fixtureServer);
  });

  it("should terminate and relaunch app successfully", async () => {
    console.log("=== Starting app restart test ===");
    
    // Step 1: Verify app is initially launched
    console.log("1. Verifying app is launched...");
    await LoginScreen.waitForScreenToDisplay();
    console.log("✅ App is launched and login screen is visible");
    
    // Step 2: Terminate the app
    console.log("2. Terminating app...");
    const platform = await driver.getPlatform();

    await driver.terminateApp(platform === 'ios' ? 'io.metamask.MetaMask-QA' : 'io.metamask.qa');
    
    // Step 3: Wait a moment
    console.log("3. Waiting before relaunch...");
    await driver.pause(3000);
    
    // Step 4: Relaunch the app
    console.log("4. Relaunching app...");
  if (platform === 'iOS') {
    await driver.activateApp('io.metamask.MetaMask-QA');
  }

  if (platform === 'Android') {
    await driver.startActivity('io.metamask.qa', 'io.metamask.MainActivity');
  }
    
    // Step 5: Wait for app to stabilize
    console.log("5. Waiting for app to stabilize...");
    await driver.pause(5000);
    
    // Step 6: Verify app is accessible again
    console.log("6. Verifying app is accessible...");
    try {
      await LoginScreen.waitForScreenToDisplay();
      console.log("✅ App is accessible after restart");
    } catch (error) {
      console.log("❌ App not accessible after restart:", error.message);
      throw new Error("App not accessible after restart");
    }
    
    console.log("=== App restart test completed successfully ===");
  });

//   it("should test app reset method", async () => {
//     console.log("=== Testing app reset method ===");
    
//     // Verify app is launched
//     await LoginScreen.waitForScreenToDisplay();
//     console.log("✅ App is launched");
    
//     // Use reset method (terminates and relaunches)
//     console.log("🔄 Resetting app...");
//     try {
//       await driver.reset();
//       console.log("✅ App reset successfully");
//     } catch (error) {
//       console.log("❌ App reset failed:", error.message);
//       throw new Error("App reset failed");
//     }
    
//     // Wait for app to stabilize
//     await driver.pause(5000);
    
//     // Verify app is accessible
//     try {
//       await LoginScreen.waitForScreenToDisplay();
//       console.log("✅ App is accessible after reset");
//     } catch (error) {
//       console.log("❌ App not accessible after reset:", error.message);
//       throw new Error("App not accessible after reset");
//     }
    
//     console.log("=== App reset test completed successfully ===");
//   });
}); 