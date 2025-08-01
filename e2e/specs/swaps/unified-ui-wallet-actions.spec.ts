'use strict';
import { Mockttp } from 'mockttp';
import { loginToApp } from '../../viewHelper';
import TabBarComponent from '../../pages/wallet/TabBarComponent';
import WalletActionsBottomSheet from '../../pages/wallet/WalletActionsBottomSheet.js';
import FixtureBuilder from '../../framework/fixtures/FixtureBuilder';
import { withFixtures } from '../../framework/fixtures/FixtureHelper';
import { SmokeSwaps } from '../../tags.js';
import WalletView from '../../pages/wallet/WalletView';
import Assertions from '../../framework/Assertions';
import TestHelpers from '../../helpers.js';

describe(SmokeSwaps('Trade: Unified UI Wallet Actions'), () => {
  let mockServer: Mockttp | undefined;

  beforeAll(async () => {
    // No server port setup needed for simplified tests
  });

  afterAll(async () => {
    if (mockServer) {
      await mockServer.stop();
    }
  });

  it('should display wallet actions bottom sheet when tapping actions button', async () => {
    await withFixtures(
      {
        fixture: new FixtureBuilder().build(),
        restartDevice: true,
      },
      async () => {
        await loginToApp();

        // Wait for wallet to load
        await TestHelpers.delay(3000);
        await Assertions.expectElementToBeVisible(WalletView.container);

        // Tap the actions button
        await TabBarComponent.tapActions();

        // Verify that wallet actions bottom sheet is visible with key buttons
        await Assertions.expectElementToBeVisible(
          WalletActionsBottomSheet.swapButton,
        );
        await Assertions.expectElementToBeVisible(
          WalletActionsBottomSheet.sendButton,
        );
        await Assertions.expectElementToBeVisible(
          WalletActionsBottomSheet.receiveButton,
        );
      },
    );
  });

  it('should navigate when tapping swap button from wallet actions', async () => {
    await withFixtures(
      {
        fixture: new FixtureBuilder().build(),
        restartDevice: true,
      },
      async () => {
        await loginToApp();

        // Wait for wallet to load
        await TestHelpers.delay(3000);
        await Assertions.expectElementToBeVisible(WalletView.container);

        // Tap the actions button
        await TabBarComponent.tapActions();

        // Tap swap button
        await WalletActionsBottomSheet.tapSwapButton();

        // Add small delay for navigation
        await TestHelpers.delay(1000);

        // Verify navigation occurred (swap bottom sheet should be dismissed)
        await Assertions.expectElementToNotBeVisible(
          WalletActionsBottomSheet.sendButton,
        );
      },
    );
  });
});
