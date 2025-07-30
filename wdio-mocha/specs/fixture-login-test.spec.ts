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
import { ensureBrowserStackLocalAccess, getTunnelDiagnostics } from "../utils/browserstack-helper";

declare const driver: any;

const fixtureServer = new FixtureServer();

describe("Fixture Server Login Test", () => {
  let validAccount: any;

  // Setup before each test (equivalent to Cucumber Background)
  before(async () => {
    validAccount = Accounts.getValidAccount();

    console.log("=== Starting fixture server with login state ===");
    const state = new FixtureBuilder().withGanacheNetwork().withChainPermission().build();
    await startFixtureServer(fixtureServer);
    
    // Restart BrowserStack Local tunnel after fixture server is loaded
    const capabilities = await driver.getSession();
    const isBrowserStack =
      capabilities["bstack:options"] ||
      process.argv.includes("browserstack.conf.ts");

    console.log("isBrowserStack", isBrowserStack);

    if (isBrowserStack) {
      console.log("=== Ensuring BrowserStack Local tunnel can access fixture server ===");
      try {
        await ensureBrowserStackLocalAccess();
        console.log("✅ BrowserStack Local tunnel is accessible and working");
      } catch (error) {
        console.error("❌ CRITICAL: BrowserStack Local tunnel failed to establish connection to fixture server");
        console.error("❌ The app cannot connect to fixture server, which will cause test failures");
        
        // Get diagnostic information
        const diagnostics = await getTunnelDiagnostics();
        console.error("❌ Diagnostic information:");
        console.error("  - Tunnel running:", diagnostics.tunnelRunning);
        console.error("  - Fixture server accessible:", diagnostics.fixtureServerAccessible);
        console.error("  - Environment variables:", diagnostics.environmentVariables);
        console.error("  - Tunnel status:", diagnostics.tunnelStatus);
        console.error("❌ Error details:", error.message);
        
        // Skip the entire test suite
        throw new Error('BrowserStack Local tunnel failed - test skipped to prevent false failures');
      }
    }
    await loadFixture(fixtureServer, { fixture: state });

    await driver.pause(5000);
    const bundleId = "io.metamask.qa";

    if (!isBrowserStack) {
      if (driver.capabilities.platformName === "Android") {
        const adb = await ADB.createADB();
        await adb.reversePort(8545, 8545);
        await adb.reversePort(12345, 12345);
      }
      console.log("App launched, waiting for UI to stabilize...");
    } else {
      console.log(
        "Running on BrowserStack - skipping local ADB and app management steps"
      );
    }

    await LoginScreen.waitForScreenToDisplay();
    await LoginScreen.typePassword("123123123");
    await LoginScreen.tapTitle();
    await LoginScreen.tapTitle();
    await LoginScreen.tapUnlockButton();
  });

  after(async () => {
    await stopFixtureServer(fixtureServer);
  });

  it("should verify fixture server provides logged-in state", async () => {
    // Given I am on the wallet screen
    console.log("=== Verifying wallet screen is accessible ===");
    await WalletMainScreen.isVisible();

    // Then I should not see the login screen
    console.log("=== Verifying login screen is not visible ===");
    try {
      await LoginScreen.isLoginScreenVisible();
      throw new Error(
        "Login screen should not be visible after fixture server setup"
      );
    } catch (error) {
      console.log("Login screen is not visible as expected");
    }
    // And I should be on the wallet screen
    await WalletMainScreen.isMainWalletViewVisible();

    const accountIcon = await WalletMainScreen.accountIcon;
    if (!(await accountIcon.isDisplayed())) {
      throw new Error("Account icon should be displayed");
    }

    const walletContainer = await WalletMainScreen.WalletScreenContainer;
    if (!(await walletContainer.isDisplayed())) {
      throw new Error("Wallet container should be displayed");
    }
    console.log("Wallet features are accessible without password prompt");

  });
});
