import * as CONSTANTS from './constants';
const Web3 = require('web3');
const { readFile } = require('../../utils/wallet-utils');

function loadWeb3() {
  return {
    type: CONSTANTS.WEB3_LOAD,
  };
}

function loadWeb3Success(data) {
  return {
    type: CONSTANTS.WEB3_LOAD_SUCCESS,
    payload: data,
    error: '',
  };
}

function loadWeb3Error(error) {
  return {
    type: CONSTANTS.WEB3_LOAD_ERROR,
    error,
  }
}

export function handleWeb3Load() {
  return function(dispatch) {
    dispatch(loadWeb3());
    return new Promise((resolve) => {
      try {
        if (window.ethereum) {
          window.ethereum.enable();
        }
        const web3 = new Web3(window.web3.currentProvider);
        dispatch(loadWeb3Success(web3));
        resolve(web3);

      } catch(error) {
        dispatch(loadWeb3Error(error.message));
        resolve(error.message)
      }
    })
  }
}

function loadFiles() {
  return {
    type: CONSTANTS.LOAD_FILES,
  };
}

function loadFilesSuccess(wallet, config, abiRollup, abiTokens) {
  return {
    type: CONSTANTS.LOAD_FILES_SUCCESS,
    payload: { wallet, config, abiRollup, abiTokens },
    error: '',
  }
}

function loadFilesError(error) {
  return {
    type: CONSTANTS.LOAD_FILES_ERROR,
    error,
  }
}

export function handleLoadFiles(walletFile, configFile, abiFile, abiTokensFile) {
  return function(dispatch) {
    dispatch(loadFiles());
    return new Promise( async (resolve) => {
      try {
        const wallet = await readFile(walletFile);
        const config = await readFile(configFile);
        const abiRollup = await readFile(abiFile);
        const abiTokens = await readFile(abiTokensFile);
        dispatch(loadFilesSuccess(wallet, config, abiRollup, abiTokens));
        resolve({wallet, config, abiRollup, abiTokens});
      } catch(error) {
        dispatch(loadFilesError(error));
      }
    })
  }
}