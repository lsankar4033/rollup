import * as CONSTANTS from './constants';

const initialState = {
  errorWallet: '',
  isLoadingWallet: false,
  wallet: '',
  password: '',
  isLoadingFiles: false,
  errorFiles: '',
  config: '',
  abiRollup: '',
  abiTokens: '',
  isLoadingOp: false,
  apiOperator: '',
  errorOp: '',
};

function general(state = initialState, action) {
  switch(action.type) {
    case CONSTANTS.LOAD_WALLET:
      return {
        ...state,
        isLoadingWallet: true,
        errorWallet: '',
      }
    case CONSTANTS.LOAD_WALLET_SUCCESS:
          return {
            ...state,
            isLoadingWallet: false,
            wallet: action.payload.wallet,
            password: action.payload.password,
            errorWallet: '',
          }
    case CONSTANTS.LOAD_WALLET_ERROR:
      return {
        ...state,
        isLoadingWallet: false,
        wallet: '',
        password: '',
        errorWallet: action.error,
      }
    case CONSTANTS.LOAD_FILES:
      return {
          ...state,
          isLoadingFiles: true,
          errorFiles: '',
      }
    case CONSTANTS.LOAD_FILES_SUCCESS:
      return {
          ...state,
          config: action.payload.config,
          abiRollup: action.payload.abiRollup,
          abiTokens: action.payload.abiTokens,
          isLoadingFiles: false,
          errorFiles: ''
      };
    case CONSTANTS.LOAD_FILES_ERROR:
      return {
          ...state,
          isLoadingFiles: false,
          errorFiles: action.error,
      };
      case CONSTANTS.LOAD_OPERATOR:
        return {
            ...state,
            isLoadingOp: true,
            errorOp: '',
        }
      case CONSTANTS.LOAD_OPERATOR_SUCCESS:
        return {
            ...state,
            isLoadingOp: false,
            apiOperator: action.payload,
            errorOp: ''
        };
      case CONSTANTS.LOAD_OPERATOR_ERROR:
        return {
            ...state,
            isLoadingOp: false,
            errorOp: action.error,
        };
    default:
      return state;
  }
}

export default general;