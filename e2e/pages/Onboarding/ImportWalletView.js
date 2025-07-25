import { ChoosePasswordSelectorsIDs } from '../../selectors/Onboarding/ChoosePassword.selectors';
import { ImportFromSeedSelectorsIDs } from '../../selectors/Onboarding/ImportFromSeed.selectors';
import Matchers from '../../utils/Matchers';
import Gestures from '../../utils/Gestures';

class ImportWalletView {
  get container() {
    return Matchers.getElementByID(ImportFromSeedSelectorsIDs.CONTAINER_ID);
  }

  get title() {
    return Matchers.getElementByID(ImportFromSeedSelectorsIDs.SCREEN_TITLE_ID);
  }

  get newPasswordInput() {
    return Matchers.getElementByID(
      ChoosePasswordSelectorsIDs.NEW_PASSWORD_INPUT_ID,
    );
  }

  get confirmPasswordInput() {
    return Matchers.getElementByID(
      ChoosePasswordSelectorsIDs.CONFIRM_PASSWORD_INPUT_ID,
    );
  }

  get seedPhraseInput() {
    return Matchers.getElementByID(
      ImportFromSeedSelectorsIDs.SEED_PHRASE_INPUT_ID,
    );
  }

  get continueButton() {
    return Matchers.getElementByID(
      ImportFromSeedSelectorsIDs.CONTINUE_BUTTON_ID,
    );
  }

  async enterPassword(password) {
    await Gestures.typeTextAndHideKeyboard(this.newPasswordInput, password);
  }

  async reEnterPassword(password) {
    await Gestures.typeTextAndHideKeyboard(this.confirmPasswordInput, password);
  }

  async enterSecretRecoveryPhrase(secretRecoveryPhrase) {
    const words = secretRecoveryPhrase.trim().split(/\s+/);

    for (let i = 0; i < words.length; i++) {
      let wordInput;
      if (i === 0) {
        wordInput = this.seedPhraseInput;
      } else {
        wordInput = Matchers.getElementByID(
          `${ImportFromSeedSelectorsIDs.SEED_PHRASE_INPUT_ID}_${i}`,
        );
      }

      await Gestures.clearField(wordInput);
      if (i !== 11) {
        await Gestures.typeTextWithoutKeyboard(wordInput, words[i] + ' ');
      } else {
        await Gestures.typeTextWithoutKeyboard(wordInput, words[i]);
      }
    }
  }

  async clearSecretRecoveryPhraseInputBox() {
    await Gestures.clearField(this.seedPhraseInput);
  }

  async tapContinueButton() {
    await Gestures.tap(this.continueButton);
  }

  async tapTitle() {
    await Gestures.tap(this.title);
  }
}

export default new ImportWalletView();
