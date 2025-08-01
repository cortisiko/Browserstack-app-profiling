import Assertions from '../../../framework/Assertions';
import Browser from '../../../pages/Browser/BrowserView';
import FixtureBuilder from '../../../framework/fixtures/FixtureBuilder';
import RequestTypes from '../../../pages/Browser/Confirmations/RequestTypes';
import AlertSystem from '../../../pages/Browser/Confirmations/AlertSystem';
import TabBarComponent from '../../../pages/wallet/TabBarComponent';
import TestDApp from '../../../pages/Browser/TestDApp';
import { loginToApp } from '../../../viewHelper';
import { mockEvents } from '../../../api-mocking/mock-config/mock-events';
import { SmokeConfirmationsRedesigned } from '../../../tags';
import { withFixtures } from '../../../framework/fixtures/FixtureHelper';
import FooterActions from '../../../pages/Browser/Confirmations/FooterActions';
import { buildPermissions } from '../../../fixtures/utils';
import { DappVariants } from '../../../framework/Constants';
import { MockApiEndpoint } from '../../../framework/types';

const typedSignRequestBody = {
  method: 'eth_signTypedData',
  params: [
    [
      { type: 'string', name: 'Message', value: 'Hi, Alice!' },
      { type: 'uint32', name: 'A number', value: '1337' },
    ],
    '0x76cf1CdD1fcC252442b50D6e97207228aA4aefC3',
  ],
  origin: 'localhost',
};

describe(SmokeConfirmationsRedesigned('Alert System - Signature'), () => {
  const runTest = async (
    testSpecificMock: {
      GET?: MockApiEndpoint[];
      POST?: MockApiEndpoint[];
    },
    alertAssertion: () => Promise<void>,
  ) => {
    await withFixtures(
      {
        dapps: [
          {
            dappVariant: DappVariants.TEST_DAPP,
          },
        ],
        fixture: new FixtureBuilder()
          .withSepoliaNetwork()
          .withPermissionControllerConnectedToTestDapp(
            buildPermissions(['0xaa36a7']),
          )
          .build(),
        restartDevice: true,
        testSpecificMock: {
          GET: [
            mockEvents.GET.remoteFeatureFlagsRedesignedConfirmations,
            ...(testSpecificMock.GET ?? []),
          ],
          POST: [...(testSpecificMock.POST ?? [])],
        },
      },
      async () => {
        await loginToApp();
        await TabBarComponent.tapBrowser();
        await Browser.navigateToTestDApp();
        await TestDApp.tapTypedSignButton();
        await Assertions.expectElementToBeVisible(
          RequestTypes.TypedSignRequest,
        );
        await alertAssertion();
      },
    );
  };

  describe('Security Alert API', () => {
    it('should sign typed message', async () => {
      const testSpecificMock = {
        POST: [
          {
            ...mockEvents.POST.securityAlertApiValidate,
            requestBody: typedSignRequestBody,
          },
        ],
      };

      await runTest(testSpecificMock, async () => {
        await Assertions.expectElementToNotBeVisible(
          AlertSystem.securityAlertBanner,
        );
      });
    });

    it('should show security alert for malicious request, acknowledge and confirm the signature', async () => {
      const testSpecificMock = {
        POST: [
          {
            ...mockEvents.POST.securityAlertApiValidate,
            requestBody: typedSignRequestBody,
            response: {
              block: 20733277,
              result_type: 'Malicious',
              reason: 'malicious_domain',
              description: `You're interacting with a malicious domain. If you approve this request, you might lose your assets.`,
              features: [],
            },
            ignoreFields: [
              'id',
              'jsonrpc',
              'toNative',
              'networkClientId',
              'traceContext',
            ],
          },
        ],
      };

      await runTest(testSpecificMock, async () => {
        await Assertions.expectElementToBeVisible(
          AlertSystem.securityAlertBanner,
        );
        await Assertions.expectElementToBeVisible(
          AlertSystem.securityAlertResponseMaliciousBanner,
        );
        // Confirm request
        await FooterActions.tapConfirmButton();
        await Assertions.expectElementToBeVisible(
          AlertSystem.confirmAlertModal,
        );
        // Acknowledge and confirm alert
        await AlertSystem.tapConfirmAlertCheckbox();
        await AlertSystem.tapConfirmAlertButton();
        await Assertions.expectElementToNotBeVisible(
          RequestTypes.TypedSignRequest,
        );
      });
    });

    it('should show security alert for error when validating request fails', async () => {
      const testSpecificMock = {
        GET: [
          {
            urlEndpoint:
              'https://static.cx.metamask.io/api/v1/confirmations/ppom/ppom_version.json',
            responseCode: 500,
            response: {
              message: 'Internal Server Error',
            },
          },
        ],
        POST: [
          {
            ...mockEvents.POST.securityAlertApiValidate,
            requestBody: typedSignRequestBody,
            response: {
              error: 'Internal Server Error',
              message: 'An unexpected error occurred on the server.',
            },
            responseCode: 500,
          },
        ],
      };

      await runTest(testSpecificMock, async () => {
        await Assertions.expectElementToBeVisible(
          AlertSystem.securityAlertBanner,
        );
        await Assertions.expectElementToBeVisible(
          AlertSystem.securityAlertResponseFailedBanner,
        );
      });
    });
  });

  describe('Inline Alert', () => {
    it('should show mismatch field alert, click the alert, acknowledge and confirm the signature', async () => {
      await withFixtures(
        {
          dapps: [
            {
              dappVariant: DappVariants.TEST_DAPP,
            },
          ],
          fixture: new FixtureBuilder()
            .withSepoliaNetwork()
            .withPermissionControllerConnectedToTestDapp(
              buildPermissions(['0xaa36a7']),
            )
            .build(),
          restartDevice: true,
          testSpecificMock: {
            GET: [mockEvents.GET.remoteFeatureFlagsRedesignedConfirmations],
          },
        },
        async () => {
          await loginToApp();
          await TabBarComponent.tapBrowser();
          await Browser.navigateToTestDApp();
          await TestDApp.tapSIWEBadDomainButton();
          await Assertions.expectElementToBeVisible(
            RequestTypes.PersonalSignRequest,
          );
          await Assertions.expectElementToBeVisible(AlertSystem.inlineAlert);
          // Open alert modal and acknowledge the alert
          await AlertSystem.tapInlineAlert();
          await Assertions.expectElementToBeVisible(
            AlertSystem.alertMismatchTitle,
          );
          await AlertSystem.tapAcknowledgeAlertModal();
          await AlertSystem.tapGotItAlertModalButton();
          // Confirm request
          await FooterActions.tapConfirmButton();
          await Assertions.expectElementToBeVisible(
            AlertSystem.confirmAlertModal,
          );
          // Acknowledge and confirm alert
          await AlertSystem.tapConfirmAlertCheckbox();
          await AlertSystem.tapConfirmAlertButton();
          await Assertions.expectElementToNotBeVisible(
            RequestTypes.PersonalSignRequest,
          );
        },
      );
    });
  });
});
