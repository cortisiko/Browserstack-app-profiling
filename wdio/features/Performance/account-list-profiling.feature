@temp @androidApp @performance @iosApp
# @performance

Feature: Profile the account list after importing multiple SRPs
  # This feature measures the performance of the account list
  # after importing multiple Secret Recovery Phrases.

  # Background:
  #   Given I start the fixture server with login state
  #   And I have imported my wallet
  #   #  When I fill my password in the Login screen
  #   # And The timer starts running after I tap the login button
 
  Scenario: Profile the account list after importing multiple SRPs
    Given I have imported my wallet
    And I am on the wallet screen
    And I tap on the Identicon
    Then I am on the "Account 1" account
    And I tap on button with text "Add account or hardware wallet"
    And I tap on button with text "Secret Recovery Phrase"
    And I type in my SRP 
    And I tap on button with text "Import Secret Recovery Phrase"
    And I tap on button with text "Continue"
    And I wait 
    # And I tap on the Identicon
    # And I tap on button with text "Account 7"
    # And I tap on the Identicon
    # And I collect app profiling data at test end
    # # Then the app profiling data should be saved 