import { HEALTH_DATA, ECOSYSTEM_DATA, POOLS_DATA, TOKENS_DATA } from '../types';

const initial_state = {
  health_data: null,
  ecosystem_data: null,
  pools_data: null,
  tokens_data: null,
};

// data reducer
const reducer = (state = initial_state, action) => {
  switch (action.type) {
    case HEALTH_DATA:
      return { ...state, health_data: action.payload };
    case ECOSYSTEM_DATA:
      return { ...state, ecosystem_data: action.payload };
    case POOLS_DATA:
      return { ...state, pools_data: action.payload };
    case TOKENS_DATA:
      return { ...state, tokens_data: action.payload };
    default: return { ...state };
  }
};

export default reducer;
