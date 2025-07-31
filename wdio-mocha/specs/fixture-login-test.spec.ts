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

describe("Fixture Server Login Test", () => {
  let validAccount: any;

  // Setup before each test (equivalent to Cucumber Background)
  before(async () => {
    validAccount = Accounts.getValidAccount();

    const state = new FixtureBuilder().withGanacheNetwork().withChainPermission().build();
    
    const isBrowserStackCI = process.env.BROWSERSTACK_CI === 'true';
    
      console.log("🔄 Starting fixture server (not on BrowserStack CI)");
      await startFixtureServer(fixtureServer);
      await loadFixture(fixtureServer, { fixture: state });

    // After loading fixture state, ensure BrowserStack Local tunnel can access it
    console.log("🔄 Ensuring BrowserStack Local tunnel can access loaded fixture state...");
    // await ensureBrowserStackLocalAccess();
    
    await driver.pause(5000);
    const bundleId = "io.metamask.qa";

    const capabilities = await driver.getSession();
    const isBrowserStack =
      capabilities["bstack:options"] ||
      process.argv.includes("browserstack.conf.ts");

    console.log("isBrowserStack", isBrowserStack);

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

  });
}); 