import Accounts from '../helpers/Accounts';

// Stub implementations for ganache functionality
const ganacheServer = {
  start: async () => {
    console.log('Ganache server start called (stub)');
  },
  quit: async () => {
    console.log('Ganache server quit called (stub)');
  },
  getProvider: () => {
    console.log('Ganache getProvider called (stub)');
    return null;
  }
};

const validAccount = Accounts.getValidAccount();

export const startGanache = async () => {
  console.log('startGanache called (stub)');
  await ganacheServer.start({ mnemonic: validAccount.seedPhrase });
};

export const stopGanache = async () => {
  console.log('stopGanache called (stub)');
  await ganacheServer.quit();
};

export const deployMultisig = async () => {
  console.log('deployMultisig called (stub)');
  return '0x0000000000000000000000000000000000000000';
};

export const deployErc20 = async () => {
  console.log('deployErc20 called (stub)');
  return '0x0000000000000000000000000000000000000000';
};

export const deployErc721 = async () => {
  console.log('deployErc721 called (stub)');
  return '0x0000000000000000000000000000000000000000';
};