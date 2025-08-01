import WalletView from '../../pages/wallet/WalletView';
import { loginToApp } from '../../viewHelper';
import FixtureBuilder from '../../framework/fixtures/FixtureBuilder';
import { withFixtures } from '../../framework/fixtures/FixtureHelper';
import TestHelpers from '../../helpers';
import Assertions from '../../framework/Assertions';
import NftDetectionModal from '../../pages/wallet/NftDetectionModal';
import { SmokeNetworkAbstractions } from '../../tags';

import { NftDetectionModalSelectorsText } from '../../selectors/wallet/NftDetectionModal.selectors';

describe(SmokeNetworkAbstractions('NFT Detection Modal'), () => {
  beforeAll(async () => {
    jest.setTimeout(170000);
    await TestHelpers.reverseServerPort();
  });

  it('show nft detection modal after user switches to mainnet and taps cancel when nft detection toggle is off', async () => {
    await withFixtures(
      {
        fixture: new FixtureBuilder()
          .withPreferencesController({
            useNftDetection: false,
          })
          .build(),
        restartDevice: true,
      },
      async () => {
        await loginToApp();
        await Assertions.expectElementToBeVisible(NftDetectionModal.container);

        await NftDetectionModal.tapCancelButton();
        // Check that we are on the wallet screen
        await Assertions.expectElementToBeVisible(WalletView.container);

        // Go to NFTs tab and check that the banner is visible
        await WalletView.tapNftTab();
        await Assertions.expectTextDisplayed(
          NftDetectionModalSelectorsText.NFT_AUTO_DETECTION_BANNER,
        );
      },
    );
  });

  it('show nft detection modal after user switches to mainnet and taps allow when nftDetection toggle is off', async () => {
    const testNftOnMainnet = 'Rarible';

    await withFixtures(
      {
        fixture: new FixtureBuilder()
          .withPreferencesController({
            useNftDetection: false,
          })
          .build(),
        restartDevice: true,
      },
      async () => {
        await loginToApp();

        await Assertions.expectElementToBeVisible(NftDetectionModal.container);
        await NftDetectionModal.tapAllowButton();
        // Check that we are on the wallet screen
        await Assertions.expectElementToBeVisible(WalletView.container);

        // Go to NFTs tab and check that the banner is NOT visible
        await WalletView.tapNftTab();
        await Assertions.expectTextNotDisplayed(
          NftDetectionModalSelectorsText.NFT_AUTO_DETECTION_BANNER,
        );

        await Assertions.expectTextDisplayed(testNftOnMainnet);
      },
    );
  });
});
