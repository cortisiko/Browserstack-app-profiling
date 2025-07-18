'use strict';
import { SmokeWalletPlatform } from '../../tags';
import FixtureBuilder from '../../fixtures/fixture-builder';
import {
  loadFixture,
  startFixtureServer,
  stopFixtureServer,
} from '../../fixtures/fixture-helper';
import FixtureServer from '../../fixtures/fixture-server';
import { getFixturesServerPort } from '../../fixtures/utils';
import WalletView from '../../pages/wallet/WalletView';
import { loginToApp } from '../../viewHelper';
import Assertions from '../../utils/Assertions';
import TestHelpers from '../../helpers';
import ImportSrpView from '../../pages/importSrp/ImportSrpView';
import { goToImportSrp, inputSrp } from '../multisrp/utils';
import { startMockServer } from '../../api-mocking/mock-server';
import { mockIdentityServices } from '../identity/utils/mocks';
import { UserStorageMockttpController } from '../identity/utils/user-storage/userStorageMockttpController';
import { arrangeTestUtils } from '../identity/utils/helpers';

const fixtureServer = new FixtureServer();

const valid12WordMnemonic =
  'lazy youth dentist air relief leave neither liquid belt aspect bone frame';

const valid24WordMnemonic =
  'verb middle giant soon wage common wide tool gentle garlic issue nut retreat until album recall expire bronze bundle live accident expect dry cook';

describe(SmokeWalletPlatform('Import new srp to wallet'), () => {
  const TEST_SPECIFIC_MOCK_SERVER_PORT = 8099;
  let userStorageMockttpController: UserStorageMockttpController;

  beforeAll(async () => {
    await TestHelpers.reverseServerPort();

    const mockServer = await startMockServer(
      {},
      TEST_SPECIFIC_MOCK_SERVER_PORT,
    );
    const { userStorageMockttpControllerInstance } = await mockIdentityServices(
      mockServer,
    );

    userStorageMockttpController =
      userStorageMockttpControllerInstance as UserStorageMockttpController;

    const fixture = new FixtureBuilder()
      .withImportedAccountKeyringController()
      .build();
    await startFixtureServer(fixtureServer);
    await loadFixture(fixtureServer, { fixture });
    await TestHelpers.launchApp({
      delete: true,
      newInstance: true,
      launchArgs: {
        fixtureServerPort: `${getFixturesServerPort()}`,
        mockServerPort: String(TEST_SPECIFIC_MOCK_SERVER_PORT),
      },
    });
    await loginToApp();
  });

  afterAll(async () => {
    await stopFixtureServer(fixtureServer);
  });

  it('imports a new 12 word srp', async () => {
    await goToImportSrp();
    await inputSrp(valid12WordMnemonic);
    await ImportSrpView.tapImportButton();

    const { waitUntilSyncedAccountsNumberEquals } = arrangeTestUtils(
      userStorageMockttpController,
    );

    await waitUntilSyncedAccountsNumberEquals(2);

    await Assertions.checkIfVisible(WalletView.container);
    await Assertions.checkIfElementNotToHaveText(
      WalletView.accountName as Promise<Detox.IndexableNativeElement>,
      'Account 1',
    );
  });

  it('imports a new 24 word srp', async () => {
    await goToImportSrp();
    await inputSrp(valid24WordMnemonic);
    await ImportSrpView.tapImportButton();

    const { waitUntilSyncedAccountsNumberEquals } = arrangeTestUtils(
      userStorageMockttpController,
    );

    await waitUntilSyncedAccountsNumberEquals(3);

    await Assertions.checkIfVisible(WalletView.container);
    await Assertions.checkIfElementNotToHaveText(
      WalletView.accountName as Promise<Detox.IndexableNativeElement>,
      'Account 1',
    );
  });
});
