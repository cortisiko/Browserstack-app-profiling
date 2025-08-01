import enContent from '../../../locales/languages/en.json';

export const WalletViewSelectorsIDs = {
  WALLET_CONTAINER: 'wallet-screen',
  NETWORK_NAME: 'network-name',
  NFT_CONTAINER: 'collectible-name',

  WALLET_NOTIFICATIONS_BUTTON: 'wallet-notifications-button',
  WALLET_TOKEN_DETECTION_LINK_BUTTON: 'wallet-token-detection-link-button',
  TOTAL_BALANCE_TEXT: 'total-balance-text',
  STAKE_BUTTON: 'stake-button',
  EARN_EARNINGS_HISTORY_BUTTON: 'earn-earnings-history-button',
  UNSTAKE_BUTTON: 'unstake-button',
  STAKE_MORE_BUTTON: 'stake-more-button',
  IMPORT_NFT_BUTTON: 'import-collectible-button',
  IMPORT_TOKEN_BUTTON: 'import-token-button',
  IMPORT_TOKEN_BUTTON_LINK: 'import-token-button-link',
  NAVBAR_NETWORK_BUTTON: 'open-networks-button',
  NAVBAR_NETWORK_TEXT: 'open-networks-text',
  NFT_TAB_CONTAINER: 'collectible-contracts',
  ACCOUNT_ICON: 'account-picker',
  ACCOUNT_NAME_LABEL_INPUT: 'account-label-text-input',
  ACCOUNT_NAME_LABEL_TEXT: 'account-label',
  TOKENS_CONTAINER: 'tokens',
  TOKENS_CONTAINER_LIST: 'token-list',
  ACCOUNT_OVERVIEW: 'account-overview',
  ACCOUNT_ACTIONS: 'main-wallet-account-actions',
  ACCOUNT_COPY_BUTTON: 'wallet-account-copy-button',
  EYE_SLASH_ICON: 'balance-container',
  TEST_COLLECTIBLE: 'collectible-Test Dapp NFTs #1-1',
  COLLECTIBLE_FALLBACK: 'fallback-nft-with-token-id',
  NAVBAR_ADDRESS_COPY_BUTTON: 'navbar-address-copy-button',
  SORT_DECLINING_BALANCE: 'sort-declining-balance',
  SORT_ALPHABETICAL: 'sort-alphabetical',
  SORT_BY: 'sort-by',
  NAVBAR_NETWORK_PICKER: 'network-avatar-picker',
  TOKEN_NETWORK_FILTER: 'token-network-filter',
  TOKEN_NETWORK_FILTER_ALL: 'token-network-filter-all',
  TOKEN_NETWORK_FILTER_CURRENT: 'token-network-filter-current',
  NAVBAR_TITLE_TEXT: 'navbar-title-text',
  NETWORK_AVATAR_IMAGE: 'network-avatar-image',
  NOTIFICATIONS_BUTTON: 'notifications-button',
  NOTIFICATIONS_COUNT: 'notifications-count',
  PROFILE_BUTTON: 'profile-button',
  PROFILE_BUTTON_CONTAINER: 'profile-button-container',
  PROFILE_BUTTON_AVATAR: 'profile-button-avatar',
  PROFILE_BUTTON_AVATAR_CONTAINER: 'profile-button-avatar-container',
  PROFILE_BUTTON_AVATAR_TITLE: 'profile-button-avatar-title',
  PROFILE_BUTTON_AVATAR_SUBTITLE: 'profile-button-avatar-subtitle',
  PROFILE_BUTTON_AVATAR_NETWORK: 'profile-button-avatar-network',
  PROFILE_BUTTON_AVATAR_NETWORK_TEXT: 'profile-button-avatar-network-text',
  PROFILE_BUTTON_AVATAR_NETWORK_IMAGE: 'profile-button-avatar-network-image',
  PROFILE_BUTTON_AVATAR_NETWORK_CONTAINER:
    'profile-button-avatar-network-container',
  PROFILE_BUTTON_AVATAR_NETWORK_TITLE: 'profile-button-avatar-network-title',
  PROFILE_BUTTON_AVATAR_NETWORK_SUBTITLE:
    'profile-button-avatar-network-subtitle',
  PROFILE_BUTTON_AVATAR_NETWORK_SUBTITLE_TEXT:
    'profile-button-avatar-network-subtitle-text',
  PROFILE_BUTTON_AVATAR_NETWORK_SUBTITLE_ICON:
    'profile-button-avatar-network-subtitle-icon',
  PROFILE_BUTTON_AVATAR_NETWORK_SUBTITLE_CONTAINER:
    'profile-button-avatar-network-subtitle-container',
  CAROUSEL_CONTAINER: 'carousel-container',
  CAROUSEL_PROGRESS_DOTS: 'progress-dots',
  CAROUSEL_SLIDE: (id: string | number): string => `carousel-slide-${id}`,
  CAROUSEL_SLIDE_TITLE: (id: string | number): string =>
    `carousel-slide-${id}-title`,
  CAROUSEL_SLIDE_CLOSE_BUTTON: (id: string | number): string =>
    `carousel-slide-${id}-close-button`,
  DEFI_POSITIONS_CONTAINER: 'defi-positions-container',
  DEFI_POSITIONS_NETWORK_FILTER: 'defi-positions-network-filter',
  DEFI_POSITIONS_LIST: 'defi-positions-list',
  DEFI_POSITIONS_DETAILS_CONTAINER: 'defi-positions-details-container',
  // Wallet-specific action buttons to avoid conflicts with TokenOverview
  WALLET_BUY_BUTTON: 'wallet-buy-button',
  WALLET_SWAP_BUTTON: 'wallet-swap-button',
  WALLET_BRIDGE_BUTTON: 'wallet-bridge-button',
  WALLET_SEND_BUTTON: 'wallet-send-button',
  WALLET_RECEIVE_BUTTON: 'wallet-receive-button',
} as const;

export const WalletViewSelectorsText = {
  IMPORT_TOKENS: `${enContent.wallet.no_available_tokens} ${enContent.wallet.add_tokens}`,
  NFTS_TAB: enContent.wallet.collectibles,
  TOKENS_TAB: enContent.wallet.tokens,
  HIDE_TOKENS: enContent.wallet.remove,
  STAKED_ETHEREUM: enContent.stake.staked_ethereum,
  DEFAULT_TOKEN: 'Ethereum',
  NAVBAR_TITLE_TEXT: 'Wallet',
  PERMISSIONS_SUMMARY_TAB: 'Permissions',
  ACCOUNTS_SUMMARY_TAB: 'Accounts',
  DEFI_TAB: enContent.wallet.defi,
  DEFI_NO_VISIBLE_POSITIONS: enContent.defi_positions.no_visible_positions,
  DEFI_NOT_SUPPORTED: enContent.defi_positions.not_supported,
  DEFI_ERROR_CANNOT_LOAD_PAGE: enContent.defi_positions.error_cannot_load_page,
  DEFI_ERROR_VISIT_AGAIN: enContent.defi_positions.error_visit_again,
} as const;

// Type definitions for the selectors
export type WalletViewSelectorsIDsType = typeof WalletViewSelectorsIDs;
export type WalletViewSelectorsTextType = typeof WalletViewSelectorsText;
