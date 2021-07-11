import React, { useState, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Badge, Nav, NavItem } from 'reactstrap';
import _ from 'lodash';
import numeral from 'numeral';
import logo from '../../logo.png';
import { routes } from '../../routes';

// header component
const Header = props => {
  // health data from redux
  const healthData = useSelector(content => content.data.health_data);
  // ecosystem data from redux
  const ecosystemData = useSelector(content => content.data.ecosystem_data);
  // pools data from redux
  const poolsData = useSelector(content => content.data.pools_data);
  // token data from redux
  const tokensData = useSelector(content => content.data.tokens_data);

  // responsive width
  const useWindowSize = () => {
    const [size, setSize] = useState(null);
    useLayoutEffect(() => {
      const updateSize = () => setSize(window.screen.width);
      window.addEventListener('resize', updateSize);
      updateSize();
      return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
  };
  const width = useWindowSize();

  // split path to list
  const paths = window.location.pathname && window.location.pathname.split('/').filter(path => path);

  return (
    <>
      {/* start DEX info bar */}
      <div className="d-flex align-items-center overflow-auto px-2 px-md-3 px-lg-4 py-1" style={{ height: '2.5rem' }}>
        {/* latest synced block */}
        {healthData && healthData[0] && (
          <Badge color="default" className="p-2" style={{ fontSize: '.75rem', fontWeight: 400, opacity: .75 }}>
            {"Latest synced block:"}&nbsp;&nbsp;
            {healthData[0].synced_block_height ? <a href={`https://etherscan.io/block/${healthData[0].synced_block_height}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>{healthData[0].synced_block_height}</a> : '-'}
          </Badge>
        )}
        {/* number of pools */}
        {ecosystemData && ecosystemData[0] && typeof ecosystemData[0].total_active_pairs_7d === 'number' ?
          <Badge color="dark" className="p-2" style={{ fontSize: '.75rem', fontWeight: 400 }}>
            {"Pools:"}&nbsp;&nbsp;
            <span style={{ fontWeight: 600 }}>{numeral(ecosystemData[0].total_active_pairs_7d).format('0,0')}</span>
          </Badge>
          :
          poolsData ?
            <Badge color="dark" className="p-2" style={{ fontSize: '.75rem', fontWeight: 400 }}>
              {"Pools:"}&nbsp;&nbsp;
              <span style={{ fontWeight: 600 }}>{numeral(poolsData.length).format('0,0')}</span>
            </Badge>
            :
            null
        }
        {/* number of tokens */}
        {tokensData && (
          <Badge color="dark" className="p-2 mr-1" style={{ fontSize: '.75rem', fontWeight: 400 }}>
            {"Tokens:"}&nbsp;&nbsp;
            <span style={{ fontWeight: 600 }}>{numeral(tokensData.length).format('0,0')}</span>
          </Badge>
        )}
        {/* ethereum price */}
        {ecosystemData && ecosystemData[0] && (
          <Badge color="default" className="p-2 ml-auto" style={{ fontSize: '.75rem', fontWeight: 400 }}>
            {"ETH:"}&nbsp;&nbsp;
            <span style={{ fontWeight: 600 }}>{typeof ecosystemData[0].gas_token_price_quote === 'number' ? `$${numeral(ecosystemData[0].gas_token_price_quote).format('0,0.00')}` : '-'}</span>
          </Badge>
        )}
        {/* sushi price */}
        {poolsData && _.slice(poolsData.flatMap(poolData => [poolData.token_0, poolData.token_1]).filter(tokenData => tokenData.contract_ticker_symbol && tokenData.contract_ticker_symbol.toLowerCase() === 'sushi'), 0, 1).map((tokenData, key) => (
          <Badge key={key} color="info" className="p-2" style={{ fontSize: '.75rem', fontWeight: 400 }}>
            {tokenData.contract_ticker_symbol}{":"}&nbsp;&nbsp;
            <span style={{ fontWeight: 600 }}>{typeof tokenData.quote_rate === 'number' ? `$${numeral(tokenData.quote_rate).format('0,0.00')}` : '-'}</span>
          </Badge>
        ))}
      </div>
      {/* end DEX info bar */}

      {/* navigation zone */}
      <div className="d-flex align-items-center overflow-auto mx-2 mx-md-3 mx-lg-4" style={{ height: '4rem' }}>
        {/* logo */}
        <Link to="/"><img src={logo} alt="logo" className="App-logo" style={{ width: width <= 575 ? '2rem' : width <= 991 ? '2.5rem' : '4rem', minWidth: '1.25rem' }} /></Link>
        {/* DEX name */}
        <Link to="/"><h1 className="mb-0 ml-1 ml-md-2 mr-3 mr-lg-5" style={{ fontSize: width <= 575 ? '.65rem' : width <= 991 ? '1rem' : '1.25rem', fontWeight: 600 }}>{"SushiSwap"}</h1></Link>
        {/* all navigation menus */}
        <Nav pills style={{ display: 'contents' }}>
          {routes.filter(route => route.is_menu).map((route, key) => (
            <NavItem key={key}>
              <Link to={route.path} className={`nav-link${paths[0] === route.path_check ? ' active' : ''}`}>{route.title}</Link>
            </NavItem>
          ))}
        </Nav>
      </div>
    </>
  );
}

export default Header;
