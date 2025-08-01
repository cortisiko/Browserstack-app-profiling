
import FixtureServer from "../../e2e/framework/fixtures/FixtureServer";
import ADB from "appium-adb";
import Accounts from "../../wdio/helpers/Accounts";
import LoginScreen from "../../wdio/screen-objects/LoginScreen";
import WalletMainScreen from "../../wdio/screen-objects/WalletMainScreen";
import FixtureBuilder from "../../e2e/framework/fixtures/FixtureBuilder";
import { loadFixture, startFixtureServer, stopFixtureServer } from "../../e2e/framework/fixtures/FixtureHelper";

declare const driver: any;

const fixtureServer = new FixtureServer();

describe("Fixture Server Login Test", () => {
  let validAccount: any;

  before(async () => {
    validAccount = Accounts.getValidAccount();
    const state = new FixtureBuilder().withGanacheNetwork().withChainPermission().build();
    
    await startFixtureServer(fixtureServer);
    await loadFixture(fixtureServer, { fixture: state });

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
    } else {
      console.log(
        "Running on BrowserStack - skipping local ADB and app management steps"
      );
    }
  });

  after(async () => {
    await stopFixtureServer(fixtureServer);
  });

  it('tests logging into the app using fixtures', async () => {
    await LoginScreen.waitForScreenToDisplay();
    await LoginScreen.typePassword("123123123");
    await LoginScreen.tapTitle();
    await LoginScreen.tapTitle();
    await LoginScreen.tapUnlockButton();

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
