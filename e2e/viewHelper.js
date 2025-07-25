'use strict';

import EnableDeviceNotificationsAlert from './pages/Onboarding/EnableDeviceNotificationsAlert';
import ImportWalletView from './pages/Onboarding/ImportWalletView';
import MetaMetricsOptIn from './pages/Onboarding/MetaMetricsOptInView';
import NetworkEducationModal from './pages/Network/NetworkEducationModal';
import NetworkListModal from './pages/Network/NetworkListModal';
import NetworkView from './pages/Settings/NetworksView';
import OnboardingView from './pages/Onboarding/OnboardingView';
import OnboardingCarouselView from './pages/Onboarding/OnboardingCarouselView';
import SettingsView from './pages/Settings/SettingsView';
import WalletView from './pages/wallet/WalletView';
import Accounts from '../wdio/helpers/Accounts';
import SkipAccountSecurityModal from './pages/Onboarding/SkipAccountSecurityModal';
import ProtectYourWalletModal from './pages/Onboarding/ProtectYourWalletModal';
import CreatePasswordView from './pages/Onboarding/CreatePasswordView';
import ProtectYourWalletView from './pages/Onboarding/ProtectYourWalletView';
import OnboardingSuccessView from './pages/Onboarding/OnboardingSuccessView';

import TestHelpers from './helpers';

import TermsOfUseModal from './pages/Onboarding/TermsOfUseModal';
import TabBarComponent from './pages/wallet/TabBarComponent';
import LoginView from './pages/wallet/LoginView';
import { getGanachePort } from './fixtures/utils';
import Assertions from './utils/Assertions';
import { CustomNetworks } from './resources/networks.e2e';
import ToastModal from './pages/wallet/ToastModal';
import TestDApp from './pages/Browser/TestDApp';
import SolanaNewFeatureSheet from './pages/wallet/SolanaNewFeatureSheet';

const LOCALHOST_URL = `http://localhost:${getGanachePort()}/`;
const validAccount = Accounts.getValidAccount();

export const acceptTermOfUse = async () => {
  // tap on accept term of use screen
  await Assertions.checkIfVisible(TermsOfUseModal.container);
  await TermsOfUseModal.tapScrollEndButton();
  await TermsOfUseModal.tapAgreeCheckBox();
  await TermsOfUseModal.tapAcceptButton();
  await Assertions.checkIfNotVisible(TermsOfUseModal.container);
};

/**
 * Closes various onboarding modals and dialogs.
 * @async
 * @function closeOnboardingModals
 * @param {('dismiss'|'create'|'viewAccount')} [solanaSheetAction='dismiss'] - Action to take for the Solana feature sheet.
 *   - 'dismiss': Taps "Not now" on the Solana sheet.
 *   - 'create': Taps "Create Account" on the Solana sheet.
 *   - 'viewAccount': Intended to navigate to a view/manage existing account flow for Solana.
 */
export const closeOnboardingModals = async (solanaSheetAction = 'dismiss') => {
  /*
These onboarding modals are becoming a bit wild. We need less of these so we don't
have to have all these workarounds in the tests
  */
  await TestHelpers.delay(1000);

  try {
    await Assertions.checkIfVisible(ToastModal.container);
    await ToastModal.tapToastCloseButton();
    await Assertions.checkIfNotVisible(ToastModal.container);
  } catch {
    // eslint-disable-next-line no-console
    console.log('The marketing toast is not visible');
  }

  // Handle Solana New feature sheet
  if (solanaSheetAction === 'dismiss') {
    await SolanaNewFeatureSheet.tapNotNowButton();
  } else if (solanaSheetAction === 'create') {
    await SolanaNewFeatureSheet.tapCreateAccountButton();
  } else if (solanaSheetAction === 'viewAccount') {
    await SolanaNewFeatureSheet.tapViewAccountButton();
  }
};

export const skipNotificationsDeviceSettings = async () => {
  await TestHelpers.delay(1000);

  try {
    await Assertions.checkIfVisible(
      EnableDeviceNotificationsAlert.stepOneContainer,
    );
    await EnableDeviceNotificationsAlert.tapOnEnableDeviceNotificationsButton();
    await Assertions.checkIfNotVisible(
      EnableDeviceNotificationsAlert.stepOneContainer,
    );
  } catch {
    /* eslint-disable no-console */

    console.log('The notification device alert modal is not visible');
  }
};

/**
 * Imports a wallet using a secret recovery phrase during the onboarding process.
 *
 * @async
 * @function importWalletWithRecoveryPhrase
 * @param {Object} [options={}] - Options for importing the wallet.
 * @param {string} [options.seedPhrase] - The secret recovery phrase to import the wallet. Defaults to a valid account's seed phrase.
 * @param {string} [options.password] - The password to set for the wallet. Defaults to a valid account's password.
 * @param {boolean} [options.optInToMetrics=true] - Whether to opt in to MetaMetrics. Defaults to true.
 * @param {('dismiss'|'create'|'viewAccount')} [options.solanaSheetAction='dismiss'] - Action for the Solana feature sheet.
 * @returns {Promise<void>} Resolves when the wallet import process is complete.
 */
export const importWalletWithRecoveryPhrase = async ({
  seedPhrase,
  password,
  optInToMetrics = true,
  solanaSheetAction = 'dismiss',
} = {}) => {
  // tap on import seed phrase button
  await Assertions.checkIfVisible(OnboardingCarouselView.container);
  await OnboardingCarouselView.tapOnGetStartedButton();
  await acceptTermOfUse();

  await OnboardingView.tapImportWalletFromSeedPhrase();

  await TestHelpers.delay(3500);
  // should import wallet with secret recovery phrase
  await ImportWalletView.clearSecretRecoveryPhraseInputBox();
  await ImportWalletView.enterSecretRecoveryPhrase(
    seedPhrase ?? validAccount.seedPhrase,
  );
  await ImportWalletView.tapTitle();
  await ImportWalletView.tapContinueButton();
  await TestHelpers.delay(3500);

  await CreatePasswordView.enterPassword(password ?? validAccount.password);
  await CreatePasswordView.reEnterPassword(password ?? validAccount.password);
  await CreatePasswordView.tapIUnderstandCheckBox();
  await CreatePasswordView.tapCreatePasswordButton();

  // Add delay for 1 second to avoid flakiness on ios
  if (device.getPlatform() === 'ios') TestHelpers.delay(1000);

  await Assertions.checkIfVisible(MetaMetricsOptIn.container);
  if (optInToMetrics) {
    await MetaMetricsOptIn.tapAgreeButton();
  } else {
    await MetaMetricsOptIn.tapNoThanksButton();
  }

  //'Should dismiss Enable device Notifications checks alert'
  await TestHelpers.delay(3500);
  await Assertions.checkIfVisible(OnboardingSuccessView.container);
  await OnboardingSuccessView.tapDone();
  //'Should dismiss Enable device Notifications checks alert'
  await skipNotificationsDeviceSettings();

  // should dismiss the onboarding wizard
  // dealing with flakiness on bitrise.
  await closeOnboardingModals(solanaSheetAction);
};

/**
 * Automates the process of creating a new wallet during onboarding.
 *
 * Steps performed:
 * 1. Taps the "Get Started" button on the onboarding carousel.
 * 2. Accepts the terms of use.
 * 3. Selects the "Create Wallet" option.
 * 4. Handles MetaMetrics opt-in based on the provided option.
 * 5. Enters and confirms a password for the new wallet.
 * 6. Acknowledges understanding of password requirements.
 * 7. Proceeds through the "Secure your wallet" screen, opting to be reminded later.
 * 8. Skips account security setup.
 * 9. Completes onboarding success flow.
 * 10. Dismisses device notification and automatic security check prompts.
 * 11. Handles "Protect your wallet" modal and skips security setup again.
 * 12. Closes any remaining onboarding modals.
 *
 * @async
 * @param {Object} [options={}] - Configuration options for wallet creation.
 * @param {boolean} [options.optInToMetrics=true] - Whether to opt in to MetaMetrics analytics.
 * @returns {Promise<void>} Resolves when the wallet creation flow is complete.
 */
export const CreateNewWallet = async ({ optInToMetrics = true } = {}) => {
  //'should create new wallet'

  // tap on import seed phrase button
  await OnboardingCarouselView.tapOnGetStartedButton();
  await acceptTermOfUse();
  await OnboardingView.tapCreateWallet();

  await Assertions.checkIfVisible(CreatePasswordView.container);
  await CreatePasswordView.enterPassword(validAccount.password);
  await CreatePasswordView.reEnterPassword(validAccount.password);
  await CreatePasswordView.tapIUnderstandCheckBox();
  await CreatePasswordView.tapCreatePasswordButton();

  // Check that we are on the Secure your wallet screen
  await Assertions.checkIfVisible(ProtectYourWalletView.container);
  await ProtectYourWalletView.tapOnRemindMeLaterButton();
  await device.disableSynchronization();
  await SkipAccountSecurityModal.tapIUnderstandCheckBox();
  await SkipAccountSecurityModal.tapSkipButton();
  await device.enableSynchronization();
  await TestHelpers.delay(3500);

  await Assertions.checkIfVisible(MetaMetricsOptIn.container);
  optInToMetrics
    ? await MetaMetricsOptIn.tapAgreeButton()
    : await MetaMetricsOptIn.tapNoThanksButton();

  await Assertions.checkIfVisible(OnboardingSuccessView.container);
  await OnboardingSuccessView.tapDone();
  //'Should dismiss Enable device Notifications checks alert'
  await this.skipNotificationsDeviceSettings();

  // Dismissing to protect your wallet modal
  await Assertions.checkIfVisible(ProtectYourWalletModal.collapseWalletModal);
  await ProtectYourWalletModal.tapRemindMeLaterButton();
  await SkipAccountSecurityModal.tapIUnderstandCheckBox();
  await SkipAccountSecurityModal.tapSkipButton();

  // 'should dismiss the onboarding wizard'
  // dealing with flakiness on bitrise.
  await this.closeOnboardingModals('dismiss');
};

export const addLocalhostNetwork = async () => {
  await TabBarComponent.tapSettings();
  await SettingsView.tapNetworks();
  await Assertions.checkIfVisible(NetworkView.networkContainer);

  await TestHelpers.delay(3000);
  await NetworkView.tapAddNetworkButton();
  await NetworkView.switchToCustomNetworks();

  await NetworkView.typeInNetworkName('Localhost');
  await NetworkView.typeInRpcUrl(LOCALHOST_URL);
  await NetworkView.typeInChainId('1337');
  await NetworkView.typeInNetworkSymbol('ETH\n');

  if (device.getPlatform() === 'ios') {
    // await NetworkView.swipeToRPCTitleAndDismissKeyboard(); // Focus outside of text input field
    await NetworkView.tapRpcNetworkAddButton();
  }
  await TestHelpers.delay(3000);

  await Assertions.checkIfVisible(NetworkEducationModal.container);
  await Assertions.checkIfElementToHaveText(
    NetworkEducationModal.networkName,
    'Localhost',
  );
  await NetworkEducationModal.tapGotItButton();
  await Assertions.checkIfNotVisible(NetworkEducationModal.container);
};

export const switchToSepoliaNetwork = async () => {
  await WalletView.tapNetworksButtonOnNavBar();
  await NetworkListModal.scrollToBottomOfNetworkList();
  await NetworkListModal.tapTestNetworkSwitch();
  await NetworkListModal.scrollToBottomOfNetworkList();
  await Assertions.checkIfToggleIsOn(NetworkListModal.testNetToggle);
  await NetworkListModal.changeNetworkTo(
    CustomNetworks.Sepolia.providerConfig.nickname,
  );
  await Assertions.checkIfVisible(NetworkEducationModal.container);
  await Assertions.checkIfElementToHaveText(
    NetworkEducationModal.networkName,
    CustomNetworks.Sepolia.providerConfig.nickname,
  );
  await NetworkEducationModal.tapGotItButton();
  await Assertions.checkIfNotVisible(NetworkEducationModal.container);
  try {
    await Assertions.checkIfVisible(ToastModal.container);
    await Assertions.checkIfNotVisible(ToastModal.container);
  } catch {
    // eslint-disable-next-line no-console
    console.log('Toast is not visible');
  }
};

export const loginToApp = async () => {
  const PASSWORD = '123123123';
  await Assertions.checkIfVisible(LoginView.container);
  await Assertions.checkIfVisible(LoginView.passwordInput);
  await LoginView.enterPassword(PASSWORD);
};

export const waitForTestDappToLoad = async () => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await Assertions.webViewElementExists(TestDApp.testDappFoxLogo);
      await Assertions.webViewElementExists(TestDApp.testDappPageTitle);

      await Assertions.webViewElementExists(TestDApp.DappConnectButton);
      return; // Success - page is fully loaded and interactive
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Test dapp failed to load after ${MAX_RETRIES} attempts: ${error.message}`,
        );
      }
      await TestHelpers.delay(RETRY_DELAY);
    }
  }

  throw new Error('Test dapp failed to become fully interactive');
};
