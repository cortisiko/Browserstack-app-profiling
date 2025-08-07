import FixtureServer from "../../e2e/framework/fixtures/FixtureServer";
import Accounts from "../../wdio/helpers/Accounts";
import LoginScreen from "../../wdio/screen-objects/LoginScreen";
import WalletMainScreen from "../../wdio/screen-objects/WalletMainScreen";
import FixtureBuilder from "../../e2e/framework/fixtures/FixtureBuilder";
import {
  loadFixture,
  startFixtureServer,
  stopFixtureServer,
} from "../../e2e/framework/fixtures/FixtureHelper";
import { launchAppWithDetection } from "../utils/appLauncher";

declare const driver: any;

const fixtureServer = new FixtureServer();

describe("Fixture Server Login Test", () => {
  let validAccount: any;

  before(async () => {
    validAccount = Accounts.getValidAccount();
    const state = new FixtureBuilder()
      .withGanacheNetwork()
      .withChainPermission()
      .build();

    await startFixtureServer(fixtureServer);
    await loadFixture(fixtureServer, { fixture: state });

    // Launch the app using the utility function
    await launchAppWithDetection();
  });

  after(async () => {
    await stopFixtureServer(fixtureServer);
  });

  it("tests logging into the app using fixtures", async () => {
    await LoginScreen.waitForScreenToDisplay();
    await LoginScreen.typePassword("123123123");
    await LoginScreen.tapTitle();
    await LoginScreen.tapTitle();
    await LoginScreen.tapUnlockButton();

    // await WalletMainScreen.isMainWalletViewVisible();
    await WalletMainScreen.tapIdenticon();

    // const accountIcon = await WalletMainScreen.accountIcon;
    // if (!(await accountIcon.isDisplayed())) {
    //   throw new Error("Account icon should be displayed");
    // }

    // const walletContainer = await WalletMainScreen.WalletScreenContainer;
    // if (!(await walletContainer.isDisplayed())) {
    //   throw new Error("Wallet container should be displayed");
    // }
  });
});
