import Dashboard from '../components/dashboard';
import Pools from '../components/pools';
import Pool from '../components/pool';
import Tokens from '../components/tokens';
import Token from '../components/token';

// list of routes map to component and other configurations
export const routes = [
  { path: '/', Component: Dashboard, exact: true, title: 'Dashboard' },
  { path: '/:dex_name', Component: Dashboard, exact: true, title: 'Dashboard', is_menu: true },
  { path: '/:dex_name/pools', Component: Pools, exact: true, title: 'Pools', is_menu: true, path_check: 'pools' },
  { path: '/:dex_name/pools/:address', Component: Pool, exact: true },
  { path: '/:dex_name/tokens', Component: Tokens, exact: true, title: 'Tokens', is_menu: true, path_check: 'tokens' },
  { path: '/:dex_name/tokens/:address', Component: Token, exact: true },
  { Component: Dashboard }
];
