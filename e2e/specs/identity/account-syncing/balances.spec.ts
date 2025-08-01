import {
  importWalletWithRecoveryPhrase,
  loginToApp,
} from '../../../viewHelper';
import WalletView from '../../../pages/wallet/WalletView';
import AccountListBottomSheet from '../../../pages/wallet/AccountListBottomSheet';
import Assertions from '../../../framework/Assertions';
import { SmokeIdentity } from '../../../tags.js';
import { USER_STORAGE_FEATURE_NAMES } from '@metamask/profile-sync-controller/sdk';
import { withIdentityFixtures } from '../utils/withIdentityFixtures.ts';
import { arrangeTestUtils } from '../utils/helpers.ts';
import {
  UserStorageMockttpControllerEvents,
  UserStorageMockttpController,
} from '../utils/user-storage/userStorageMockttpController.ts';
import AddAccountBottomSheet from '../../../pages/wallet/AddAccountBottomSheet';
import FixtureBuilder, {
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_2,
} from '../../../framework/fixtures/FixtureBuilder';
import { defaultGanacheOptions } from '../../../framework/Constants';
import { createUserStorageController } from '../utils/mocks.ts';

describe(SmokeIdentity('Account syncing - Accounts with Balances'), () => {
  let sharedUserStorageController: UserStorageMockttpController;

  beforeAll(async () => {
    sharedUserStorageController = createUserStorageController();
  });

  const balancesAccounts = [
    DEFAULT_FIXTURE_ACCOUNT,
    DEFAULT_FIXTURE_ACCOUNT_2,
    '0x08C215b461932f44Fab0D15E5d1FF4C5aF591AF0',
  ];

  it('should gracefully handle adding accounts with balances and synced accounts', async () => {
    await withIdentityFixtures(
      {
        userStorageFeatures: [USER_STORAGE_FEATURE_NAMES.accounts],
        sharedUserStorageController,
      },
      async ({ mockServer: _mockServer, userStorageMockttpController }) => {
        const { prepareEventsEmittedCounter } = arrangeTestUtils(
          userStorageMockttpController,
        );
        const { waitUntilEventsEmittedNumberEquals } =
          prepareEventsEmittedCounter(
            UserStorageMockttpControllerEvents.PUT_SINGLE,
          );

        await loginToApp();

        await WalletView.tapIdenticon();
        // Should see default account
        await Assertions.expectElementToBeVisible(
          AccountListBottomSheet.getAccountElementByAccountName('Account 1'),
        );

        // Add another second EVM account
        await AccountListBottomSheet.tapAddAccountButton();
        await AddAccountBottomSheet.tapCreateEthereumAccount();

        await waitUntilEventsEmittedNumberEquals(1);
      },
    );

    const onboardingFixture = new FixtureBuilder()
      .withOnboardingFixture()
      .build();
    await withIdentityFixtures(
      {
        userStorageFeatures: [USER_STORAGE_FEATURE_NAMES.accounts],
        sharedUserStorageController,
        fixture: onboardingFixture,
        mockBalancesAccounts: balancesAccounts,
      },
      async () => {
        await importWalletWithRecoveryPhrase({
          seedPhrase: defaultGanacheOptions.mnemonic,
        });

        await WalletView.tapIdenticon();

        const visibleAccounts = ['Account 1', 'Account 2', 'Account 3']; // Only 2 accounts and synced, the third account is due to balances

        for (const accountName of visibleAccounts) {
          await Assertions.expectElementToBeVisible(
            AccountListBottomSheet.getAccountElementByAccountName(accountName),
            {
              description: `Account with name "${accountName}" should be visible`,
            },
          );
        }
      },
    );
  });
});
