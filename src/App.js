import React, { useEffect } from 'react';
import './App.css';
import { withRouter } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { HEALTH_DATA, ECOSYSTEM_DATA, POOLS_DATA, TOKENS_DATA } from './redux/types';
import { request as covalentRequest } from './api/covalent';
import Header from './layouts/header';
import Footer from './layouts/footer';

const App = ({ children, location, match }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await covalentRequest(`/${process.env.REACT_APP_CHAIN_ID}/xy=k/${process.env.REACT_APP_DEX_NAME}/health/`, {});
        if (response) {
          dispatch({ type: HEALTH_DATA, payload: response.data ? response.data.items : [] });
        }
      } catch (error) {}
    };
    getData();
    const interval = setInterval(() => getData(), 10 * 1000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await covalentRequest(`/${process.env.REACT_APP_CHAIN_ID}/xy=k/${process.env.REACT_APP_DEX_NAME}/ecosystem/`, {});
        if (response) {
          dispatch({ type: ECOSYSTEM_DATA, payload: response.data ? response.data.items : [] });
        }
      } catch (error) {}
    };
    getData();
    const interval = setInterval(() => getData(), 10 * 1000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    const getData = async () => {
      const data = [];
      let page = 0;
      let hasMore = true;
      while (hasMore) {
        try {
          const response = await covalentRequest(`/${process.env.REACT_APP_CHAIN_ID}/xy=k/${process.env.REACT_APP_DEX_NAME}/pools/`, { 'page-number': page });
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
      dispatch({ type: POOLS_DATA, payload: data });
    };
    getData();
    const interval = setInterval(() => getData(), 30 * 1000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    const getData = async () => {
      const data = [];
      let page = 0;
      let hasMore = true;
      while (hasMore) {
        try {
          const response = await covalentRequest(`/${process.env.REACT_APP_CHAIN_ID}/xy=k/${process.env.REACT_APP_DEX_NAME}/tokens/`, { 'page-number': page });
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
      dispatch({ type: TOKENS_DATA, payload: data });
    };
    getData();
    const interval = setInterval(() => getData(), 30 * 1000);
    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <div className="App">
      <Header />
      <div className="mx-2 mx-md-3 mx-lg-4" style={{ minHeight: '77vh' }}>
        {children}
      </div>
      <Footer />
    </div>
  );
}

export default withRouter(App);
