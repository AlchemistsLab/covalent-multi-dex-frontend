import React, { useState, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { numberOptimizeDecimal } from '../../utils';
import { Row, Col, Button, Input, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import _ from 'lodash';
import numeral from 'numeral';
import BootstrapTable from 'react-bootstrap-table-next';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'react-feather';
import Loader from 'react-loader-spinner';

const Tokens = props => {
  // pools data from redux
  const poolsData = useSelector(content => content.data.pools_data);
  // tokens data from redux
  const tokensData = useSelector(content => content.data.tokens_data);

  // list of num row per page
  const perPageSizes = [5, 10, 25, 100];

  // pools sort info
  const [tokensSort, setTokensSort] = useState({ field: 'total_liquidity_quote', direction: 'desc' });
  // word for filter tokens by token/address
  const [tokensFilter, setTokensFilter] = useState('');
  // num tokens per table's page
  const [tokensPerPage, setTokensPerPage] = useState(10);
  // state of num tokens per page dropdown open
  const [tokensPerPageDropdownOpen, setTokensPerPageDropdownOpen] = useState(false);
  // toggle function of num tokens per page dropdown
  const toggleTokensPerPageDropdown = () => setTokensPerPageDropdownOpen(!tokensPerPageDropdownOpen);
  // tokens table page selected
  const [tokensPage, setTokensPage] = useState(0);

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

  // normalize and filter tokens data
  const filterredTokensData = tokensData && tokensData.map((tokenData, i) => {
    return {
      ...tokenData,
      rank: i,
      contract_name: tokenData.contract_name ? tokenData.contract_name : '',
      logo_url: tokenData.logo_url ? tokenData.logo_url : tokenData.contract_ticker_symbol && poolsData ? _.head(poolsData.flatMap(poolData => [poolData.token_0, poolData.token_1]).filter(_tokenData => _tokenData.contract_ticker_symbol === tokenData.contract_ticker_symbol).map(_tokenData => _tokenData.logo_url)) : null,
      total_liquidity_quote: typeof tokenData.total_liquidity_quote === 'number' ? tokenData.total_liquidity_quote : -1,
      total_volume_24h_quote: typeof tokenData.total_volume_24h_quote === 'number' ? tokenData.total_volume_24h_quote : -1,
      total_liquidity: typeof tokenData.total_liquidity === 'number' || typeof tokenData.total_liquidity === 'string' ? Number(tokenData.total_liquidity) / Math.pow(10, tokenData.contract_decimals) : -1,
      total_volume_24h: typeof tokenData.total_volume_24h === 'number' || typeof tokenData.total_volume_24h === 'string' ? Number(tokenData.total_volume_24h) / Math.pow(10, tokenData.contract_decimals) : -1,
      swap_count_24h: typeof tokenData.swap_count_24h === 'number' ? tokenData.swap_count_24h : -1,
      quote_rate: typeof tokenData.quote_rate === 'number' ? tokenData.quote_rate : -1,
    };
  }).filter(tokenData => !tokensFilter ||
    tokensFilter.toLowerCase() === tokenData.contract_address ||
    tokenData.contract_name.toLowerCase().indexOf(tokensFilter.toLowerCase()) > -1 ||
    tokenData.contract_ticker_symbol.toLowerCase().indexOf(tokensFilter.toLowerCase()) > -1
  ); // filter by user's text input

  // filter tokens data on page selected
  const filterredPageTokensData = filterredTokensData && filterredTokensData.filter((tokenData, i) => i >= tokensPage * tokensPerPage && i < (tokensPage + 1) * tokensPerPage);

  return (
    <div className="my-2 my-md-3 my-lg-4 mx-auto px-0 px-md-3 px-lg-5" style={{ maxWidth: '80rem' }}>
      <Row className="mt-3 mx-1">
        <Col lg="12" md="12" xs="12">
          {/* tokens title and filter box */}
          <Row className="mb-2">
            <Col lg="6" md="6" xs="12" className="d-flex align-items-center">
              <h3 className="mb-0" style={{ fontWeight: 600 }}>{"All Tokens"}</h3>
            </Col>
            {tokensData && (
              <Col lg="6" md="6" xs="12" className="d-flex align-items-center justify-content-start justify-content-md-end mt-2 mt-md-0">
                <Input
                  placeholder="Filter by Symbol / Address"
                  onChange={e => { setTokensFilter(e.target.value); setTokensPage(0); }}
                  style={{ maxWidth: '20rem' }}
                />
              </Col>
            )}
          </Row>
          {/* tokens table */}
          <BootstrapTable
            keyField="rank"
            bordered={false}
            noDataIndication={tokensData ? 'No Data' : <span className="d-flex align-items-center justify-content-center">{"Loading"}<Loader type="ThreeDots" color="white" width="14" height="14" className="mt-1 ml-1" /></span>}
            classes={`${width <= 575 ? 'table-responsive ' : ''}pb-0`}
            data={!tokensData ? [] : _.orderBy(filterredPageTokensData, [tokensSort.field || 'rank'], [tokensSort.direction])}
            columns={[
              {
                dataField: 'contract_name',
                text: 'Name',
                headerFormatter: column => (
                  <span className={`${tokensSort.field === column.dataField ? 'text-white' : ''}`} style={{ fontWeight: tokensSort.field === column.dataField ? 700 : 500 }}>
                    {column.text}
                    {tokensSort.field === column.dataField && (
                      <span className="ml-1">
                        {tokensSort.direction === 'desc' ? <ArrowDown /> : <ArrowUp />}
                      </span>
                    )}
                  </span>
                ),
                headerEvents: {
                  onClick: (e, column) => setTokensSort({ field: column.dataField, direction: tokensSort.field === column.dataField && tokensSort.direction === 'desc' ? 'asc' : 'desc' })
                },
                headerStyle: {
                  cursor: 'pointer',
                  minWidth: '12.5rem'
                },
                formatter: (cell, row) => (
                  <Link to={`/tokens/${row.contract_address}`} className="d-flex align-items-center">
                    <img src={row.logo_url} alt="" className="avatar pool-token-0 mr-3" />
                    <div>
                      <span>{cell}</span>
                      <div className="text-muted" style={{ fontSize: '.75rem', fontWeight: 300 }}>{row.contract_ticker_symbol}</div>
                    </div>
                  </Link>
                ),
              }, {
                dataField: 'quote_rate',
                text: 'Price',
                headerAlign: 'right',
                headerFormatter: column => (
                  <span className={`${tokensSort.field === column.dataField ? 'text-white' : ''}`} style={{ fontWeight: tokensSort.field === column.dataField ? 700 : 500 }}>
                    {column.text}
                    {tokensSort.field === column.dataField && (
                      <span className="ml-1">
                        {tokensSort.direction === 'desc' ? <ArrowDown /> : <ArrowUp />}
                      </span>
                    )}
                  </span>
                ),
                headerEvents: {
                  onClick: (e, column) => setTokensSort({ field: column.dataField, direction: tokensSort.field === column.dataField && tokensSort.direction === 'desc' ? 'asc' : 'desc' })
                },
                headerStyle: {
                  cursor: 'pointer'
                },
                align: 'right',
                formatter: cell => cell >= 0 ? `$${numberOptimizeDecimal(numeral(cell).format(`0,0.00${cell >= 1 ? '' : '00000000'}`))}` : '-',
              }, {
                dataField: 'total_volume_24h_quote',
                text: 'Volume 24H',
                headerAlign: 'right',
                headerFormatter: column => (
                  <span className={`${tokensSort.field === column.dataField ? 'text-white' : ''}`} style={{ fontWeight: tokensSort.field === column.dataField ? 700 : 500 }}>
                    {column.text}
                    {tokensSort.field === column.dataField && (
                      <span className="ml-1">
                        {tokensSort.direction === 'desc' ? <ArrowDown /> : <ArrowUp />}
                      </span>
                    )}
                  </span>
                ),
                headerEvents: {
                  onClick: (e, column) => setTokensSort({ field: column.dataField, direction: tokensSort.field === column.dataField && tokensSort.direction === 'desc' ? 'asc' : 'desc' })
                },
                headerStyle: {
                  cursor: 'pointer'
                },
                align: 'right',
                formatter: (cell, row) => (
                  <div>
                    <span>{cell >= 0 ? `$${numeral(cell).format('0,0') !== 'NaN' ? numeral(cell).format('0,0') : 0}` : '-'}</span>
                    <div className="text-muted" style={{ fontSize: '.75rem', fontWeight: 300 }}>{row.total_volume_24h >= 0 ? `${numeral(row.total_volume_24h).format('0,0') !== 'NaN' ? numeral(row.total_volume_24h).format('0,0') : 0}` : '-'}&nbsp;{row.contract_ticker_symbol}</div>
                  </div>
                ),
              }, {
                dataField: 'total_liquidity_quote',
                text: 'Liquidity',
                headerAlign: 'right',
                headerFormatter: column => (
                  <span className={`${tokensSort.field === column.dataField ? 'text-white' : ''}`} style={{ fontWeight: tokensSort.field === column.dataField ? 700 : 500 }}>
                    {column.text}
                    {tokensSort.field === column.dataField && (
                      <span className="ml-1">
                        {tokensSort.direction === 'desc' ? <ArrowDown /> : <ArrowUp />}
                      </span>
                    )}
                  </span>
                ),
                headerEvents: {
                  onClick: (e, column) => setTokensSort({ field: column.dataField, direction: tokensSort.field === column.dataField && tokensSort.direction === 'desc' ? 'asc' : 'desc' })
                },
                headerStyle: {
                  cursor: 'pointer'
                },
                align: 'right',
                formatter: (cell, row) => (
                  <div>
                    <span>{cell >= 0 ? `$${numeral(cell).format('0,0') !== 'NaN' ? numeral(cell).format('0,0') : 0}` : '-'}</span>
                    <div className="text-muted" style={{ fontSize: '.75rem', fontWeight: 300 }}>{row.total_liquidity >= 0 ? `${numeral(row.total_liquidity).format('0,0') !== 'NaN' ? numeral(row.total_liquidity).format('0,0') : 0}` : '-'}&nbsp;{row.contract_ticker_symbol}</div>
                  </div>
                ),
              }, {
                dataField: 'swap_count_24h',
                text: 'Transactions 24H',
                headerAlign: 'right',
                headerFormatter: column => (
                  <span className={`${tokensSort.field === column.dataField ? 'text-white' : ''}`} style={{ fontWeight: tokensSort.field === column.dataField ? 700 : 500 }}>
                    {column.text}
                    {tokensSort.field === column.dataField && (
                      <span className="ml-1">
                        {tokensSort.direction === 'desc' ? <ArrowDown /> : <ArrowUp />}
                      </span>
                    )}
                  </span>
                ),
                headerEvents: {
                  onClick: (e, column) => setTokensSort({ field: column.dataField, direction: tokensSort.field === column.dataField && tokensSort.direction === 'desc' ? 'asc' : 'desc' })
                },
                headerStyle: {
                  cursor: 'pointer'
                },
                align: 'right',
                formatter: cell => cell >= 0 ? `${numeral(cell).format('0,0') !== 'NaN' ? numeral(cell).format('0,0') : 0}` : '-',
              },
            ]}
          />
          {/* tokens paginations */}
          {filterredTokensData && Math.floor(filterredTokensData.length / perPageSizes[0]) > 0 && (
            <div className={`text-center d-${width <= 575 ? 'block' : 'flex'} align-items-center justify-content-center justify-content-md-end`}>
              {"Rows per page"}
              <ButtonDropdown direction="up" isOpen={tokensPerPageDropdownOpen} toggle={toggleTokensPerPageDropdown} className="ml-2 mr-0 mr-md-3">
                <DropdownToggle size="sm" color="default" className="dropdown-button">
                  {tokensPerPage}
                </DropdownToggle>
                <DropdownMenu>
                  {perPageSizes.map((perPageSize, key) => (
                    <DropdownItem
                      key={key}
                      disabled={tokensPerPage === perPageSize}
                      onClick={() => { setTokensPerPage(perPageSize); setTokensPage(0); }}
                      className={`text-${tokensPerPage === perPageSize ? 'muted' : 'dark'}`}
                      style={{ background: tokensPerPage === perPageSize ? 'rgba(0,0,0,.05)' : undefined, fontWeight: 600 }}
                    >
                      {perPageSize}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </ButtonDropdown>
              {width <= 575 && (<br />)}
              <Button
                color="default"
                size="sm"
                disabled={tokensPage < 1}
                onClick={() => setTokensPage(tokensPage - 1)}
                className="ml-0 mr-2"
              >
                <ChevronLeft />
              </Button>
              {(tokensPage * tokensPerPage) + 1}
              {" - "}
              {(tokensPage + 1) * tokensPerPage > filterredTokensData.length ? filterredTokensData.length : (tokensPage + 1) * tokensPerPage}
              {" of "}
              {numeral(filterredTokensData.length).format('0,0')}
              <Button
                color="default"
                size="sm"
                disabled={(tokensPage + 1) * tokensPerPage > filterredTokensData.length}
                onClick={() => setTokensPage(tokensPage + 1)}
                className="ml-2"
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default Tokens;
