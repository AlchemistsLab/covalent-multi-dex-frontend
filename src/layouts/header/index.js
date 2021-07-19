import React, { useState, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HEALTH_DATA, ECOSYSTEM_DATA, POOLS_DATA, TOKENS_DATA } from '../../redux/types';
import { dexs } from '../../utils';
import { Badge, Nav, NavItem, UncontrolledDropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { ChevronDown } from 'react-feather';
import _ from 'lodash';
import numeral from 'numeral';
import { routes } from '../../routes';

// header component
const Header = props => {
  // health data from redux
  const healthData = useSelector(content => content.data[HEALTH_DATA]);
  // ecosystem data from redux
  const ecosystemData = useSelector(content => content.data[ECOSYSTEM_DATA]);
  // pools data from redux
  const poolsData = useSelector(content => content.data[POOLS_DATA]);
  // token data from redux
  const tokensData = useSelector(content => content.data[TOKENS_DATA]);

  // split path to list
  const paths = window.location.pathname && window.location.pathname.split('/').filter(path => path);
  // dex name
  const dexName = paths && paths[0] && paths[0].toLowerCase();
  // dex data
  const dexData = dexs[dexs.findIndex(dex => dex.dex_name === dexName)] || dexs[0];

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

  return (
    <>
      {/* start DEX info bar */}
      <div className="d-flex align-items-center overflow-auto px-2 px-md-3 px-lg-4 py-1" style={{ height: '2.5rem' }}>
        {/* latest synced block */}
        {healthData && healthData[0] && (
          <Badge color="default" className="p-2" style={{ fontSize: '.75rem', fontWeight: 400, opacity: .75 }}>
            {"Latest synced block:"}&nbsp;&nbsp;
            {healthData[0].synced_block_height ? <a href={`${dexData.explorer.url}${dexData.explorer.block_route.replace('{block}', healthData[0].synced_block_height)}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>{healthData[0].synced_block_height}</a> : '-'}
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
        {/* gas price */}
        {ecosystemData && ecosystemData[0] && (
          <Badge color="default" className="p-2 ml-auto" style={{ fontSize: '.75rem', fontWeight: 400 }}>
            {dexData.gas_symbol}{":"}&nbsp;&nbsp;
            <span style={{ fontWeight: 600 }}>{typeof ecosystemData[0].gas_token_price_quote === 'number' ? `$${numeral(ecosystemData[0].gas_token_price_quote).format('0,0.00')}` : '-'}</span>
          </Badge>
        )}
        {/* dex's coin price */}
        {poolsData && _.slice(poolsData.flatMap(poolData => [poolData.token_0, poolData.token_1]).filter(tokenData => tokenData.contract_ticker_symbol && tokenData.contract_ticker_symbol.toLowerCase() === dexData.symbol.toLowerCase()), 0, 1).map((tokenData, key) => (
          <Badge key={key} color="info" className="p-2" style={{ fontSize: '.75rem', fontWeight: 400 }}>
            {tokenData.contract_ticker_symbol}{":"}&nbsp;&nbsp;
            <span style={{ fontWeight: 600 }}>{typeof tokenData.quote_rate === 'number' ? `$${numeral(tokenData.quote_rate).format('0,0.00')}` : '-'}</span>
          </Badge>
        ))}
      </div>
      {/* end DEX info bar */}

      {/* navigation zone */}
      <div className="d-flex align-items-center my-2 mx-2 mx-md-3 mx-lg-4 ml-4" style={{ maxWidth: '80rem', height: '4rem', overflowX: 'auto', overflowY: 'hidden' }}>
        {/* DEXs' name select */}
        <UncontrolledDropdown style={{ position: 'absolute' }}>
          <DropdownToggle className="d-flex align-items-center mr-2 mr-md-3 mr-lg-4 py-2 px-2 px-md-3">
            {/* logo */}
            <img src={dexData.logo_url} alt="logo" className="App-logo mr-2" style={{ width: width <= 575 ? '1.75rem' : '2.25rem', minWidth: '1.25rem' }} />
            <h1 className="mb-0" style={{ fontSize: width <= 575 ? '.65rem' : width <= 991 ? '1rem' : '1.25rem', fontWeight: 600 }}>{dexData.title}</h1>
            {width > 575 && (<ChevronDown className="ml-1" style={{ width: '1.25rem' }} />)}
          </DropdownToggle>
          <DropdownMenu right={width > 575} className="mr-2 mr-md-3 mr-lg-4" style={{ left: width <= 575 ? 0 : null }}>
            {dexs.map((dex, key) => (
              <a key={key} href={`/${dex.dex_name}`} className={`dropdown-item text-${dex.dex_name === dexData.dex_name ? 'muted disabled' : 'dark'}`} style={{ fontWeight: 600 }}>
                <img src={dex.logo_url} alt="" className="mr-2" style={{ width: width <= 575 ? '1.25rem' : '1.75rem', minWidth: '1rem' }} />
                {dex.title}
              </a>
            ))}
          </DropdownMenu>
        </UncontrolledDropdown>
        {/* all navigation menus */}
        <Nav pills className="ml-auto mr-0 mr-md-2">
          {routes.filter(route => route.is_menu).map((route, key) => (
            <NavItem key={key}>
              <Link to={route.path.replace(':dex_name', dexData.dex_name)} className={`nav-link${paths[1] === route.path_check ? ' active' : ''}`} style={{ fontSize: width <= 575 ? '.75rem' : null }}>{route.title}</Link>
            </NavItem>
          ))}
        </Nav>
      </div>
    </>
  );
}

export default Header;
