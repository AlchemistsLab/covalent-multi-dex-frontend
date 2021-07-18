import React, { useEffect } from 'react';
import './App.css';
import { withRouter } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { HEALTH_DATA, ECOSYSTEM_DATA, POOLS_DATA, TOKENS_DATA } from './redux/types';
import { dexs } from './utils';
import { request as covalentRequest } from './api/covalent';
import Header from './layouts/header';
import Footer from './layouts/footer';

const App = ({ children, location, match }) => {
  const dispatch = useDispatch();

  // split path to list
  const paths = location.pathname && location.pathname.split('/').filter(path => path);
  // dex name
  const dexName = paths && paths[0] && paths[0].toLowerCase();
  // dex data
  const dexData = dexs[dexs.findIndex(dex => dex.dex_name === dexName)] || dexs[0];

  // request DEX health: '/{chain_id}/xy=k/{dexname}/health/'
  useEffect(() => {
    const getData = async () => {
      try {
        const response = await covalentRequest(`/${dexData.chain_id}/xy=k/${dexData.dex_name}/health/`, {});
        if (response) {
          dispatch({ type: HEALTH_DATA, payload: response.data ? response.data.items : [] });
        }
      } catch (error) {}
    };
    getData();
    // interval request (30 sec)
    const interval = setInterval(() => getData(), 30 * 1000);
    return () => clearInterval(interval);
  }, [dispatch, dexData]);

  // request DEX ecosystem: '/{chain_id}/xy=k/{dexname}/ecosystem/'
  useEffect(() => {
    const getData = async () => {
      try {
        const response = await covalentRequest(`/${dexData.chain_id}/xy=k/${dexData.dex_name}/ecosystem/`, {});
        if (response) {
          dispatch({ type: ECOSYSTEM_DATA, payload: response.data ? response.data.items : [] });
        }
      } catch (error) {}
    };
    getData();
    // interval request (30 sec)
    const interval = setInterval(() => getData(), 30 * 1000);
    return () => clearInterval(interval);
  }, [dispatch, dexData]);

  // request DEX pools: '/{chain_id}/xy=k/{dexname}/pools/'
  useEffect(() => {
    const getData = async () => {
      const data = [];
      // start pagination
      let page = 0;
      let hasMore = true;
      while (hasMore) {
        try {
          const response = await covalentRequest(`/${dexData.chain_id}/xy=k/${dexData.dex_name}/pools/`, { 'page-number': page });
          if (response && response.data) {
            if (response.data.items) {
              response.data.items.forEach(item => data.push(item));
            }
            hasMore = response.data.pagination && response.data.pagination.has_more;
          }
          else {
            hasMore = false;
          }
        } catch (error) {}
        page++;
      }
      // end pagination
      dispatch({ type: POOLS_DATA, payload: data });
    };
    getData();
    // interval request (120 sec)
    const interval = setInterval(() => getData(), 120 * 1000);
    return () => clearInterval(interval);
  }, [dispatch, dexData]);

  // request DEX tokens: '/{chain_id}/xy=k/{dexname}/tokens/'
  useEffect(() => {
    const getData = async () => {
      const data = [];
      let page = 0;
      let hasMore = true;
      // start pagination
      while (hasMore) {
        try {
          const response = await covalentRequest(`/${dexData.chain_id}/xy=k/${dexData.dex_name}/tokens/`, { 'page-number': page });
          if (response && response.data) {
            if (response.data.items) {
              response.data.items.forEach(item => data.push(item));
            }
            hasMore = response.data.pagination && response.data.pagination.has_more;
          }
          else {
            hasMore = false;
          }
        } catch (error) {}
        page++;
      }
      // end pagination
      dispatch({ type: TOKENS_DATA, payload: data });
    };
    getData();
    // interval request (120 sec)
    const interval = setInterval(() => getData(), 120 * 1000);
    return () => clearInterval(interval);
  }, [dispatch, dexData]);

  return (
    <div className="App">
      <Header /> {/* header component */}
      <div className="mx-2 mx-md-3 mx-lg-4" style={{ minHeight: '77vh' }}>
        {children} {/* component in each route */}
      </div>
      <Footer /> {/* footer component */}
    </div>
  );
}

export default withRouter(App);
