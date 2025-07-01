@temp @androidApp @performance @iosApp
# @performance

Feature: Profile network list
  # This feature measures the performance of the network list
  # when filtering and switching between accounts.

  # Background:
  #   Given I start the fixture server with login state
  #   And I have imported my wallet
  #   #  When I fill my password in the Login screen
  #   # And The timer starts running after I tap the login button
 
  Scenario: Profile network list
    Given I have imported my wallet
    And I am on the wallet view
    And I tap on the Identicon
    Then I am on the "Account 1" account
    And I tap on button with text "Add account or hardware wallet"
    And I tap on button with text "Secret Recovery Phrase"
    And I type in my SRP 
    And I tap on button with text "Import Secret Recovery Phrase"
    And I tap on button with text "Continue"
    And I tap on the Identicon
    And I tap on button with text "Account 8"
    And I tap on the networks filter
    And I filter by popular networks
    And I tap on the Identicon
    And I tap on button with text "Account 9" 