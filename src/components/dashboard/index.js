import React, { useState, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { numberOptimizeDecimal } from '../../utils';
import { Row, Col, Card, CardHeader, CardTitle, CardBody, Badge, ButtonGroup, Button, Input, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import _ from 'lodash';
import numeral from 'numeral';
import moment from 'moment';
import Moment from 'react-moment';
import { Line, Bar } from 'react-chartjs-2';
import Chart from 'chart.js';
import classNames from 'classnames';
import { chartOptions, parseOptions } from '../../variables/charts.js';
import BootstrapTable from 'react-bootstrap-table-next';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'react-feather';
import Loader from 'react-loader-spinner';

// dashboard component
const Dashboard = props => {
  // ecosystem data from redux
  const ecosystemData = useSelector(content => content.data.ecosystem_data);
  // pools data from redux
  const poolsData = useSelector(content => content.data.pools_data);
  // token data from redux
  const tokensData = useSelector(content => content.data.tokens_data);

  // list of chart duration
  const timeRanges = ['7d', '30d'];

  // chart duration of liquidity
  const [liquidityTimeRange, setLiquidityTimeRange] = useState('30d');
  // chart duration of volume
  const [volumeTimeRange, setVolumeTimeRange] = useState('30d');
  // index of date that user cursor focus on liquidity chart
  const [liquidityDateIndexFocus, setLiquidityDateIndexFocus] = useState(null);
  // index of date that user cursor focus on volume chart
  const [volumeDateIndexFocus, setVolumeDateIndexFocus] = useState(null);

  // list of num row per page
  const perPageSizes = [5, 10, 25, 100];

  // pools sort info
  const [poolsSort, setPoolsSort] = useState({ field: 'total_liquidity_quote', direction: 'desc' });
  // word for filter pools by pair/tokens/address
  const [poolsFilter, setPoolsFilter] = useState('');
  // num pools per table's page
  const [poolsPerPage, setPoolsPerPage] = useState(5);
  // state of num pools per page dropdown open
  const [poolsPerPageDropdownOpen, setPoolsPerPageDropdownOpen] = useState(false);
  // toggle function of num pools per page dropdown
  const togglePoolsPerPageDropdown = () => setPoolsPerPageDropdownOpen(!poolsPerPageDropdownOpen);
  // pools table page selected
  const [poolsPage, setPoolsPage] = useState(0);

  // pools sort info
  const [tokensSort, setTokensSort] = useState({ field: 'total_liquidity_quote', direction: 'desc' });
  // word for filter tokens by token/address
  const [tokensFilter, setTokensFilter] = useState('');
  // num tokens per table's page
  const [tokensPerPage, setTokensPerPage] = useState(5);
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

  // setup chart.js default options
  if (window.Chart) {
    parseOptions(Chart, chartOptions());
  }

  // normalize and filter pools data
  const filteredPoolsData = poolsData && poolsData.filter(poolData => poolData.token_0 && poolData.token_1).map((poolData, i) => {
    return {
      ...poolData,
      rank: i,
      name: `${poolData.token_0.contract_ticker_symbol} - ${poolData.token_1.contract_ticker_symbol}`,
      token_0_reserve: poolData.token_0.reserve / Math.pow(10, poolData.token_0.contract_decimals),
      token_1_reserve: poolData.token_1.reserve / Math.pow(10, poolData.token_1.contract_decimals),
      total_liquidity_quote: typeof poolData.total_liquidity_quote === 'number' ? poolData.total_liquidity_quote : -1,
      volume_24h_quote: typeof poolData.volume_24h_quote === 'number' ? poolData.volume_24h_quote : -1,
      volume_7d_quote: typeof poolData.volume_7d_quote === 'number' ? poolData.volume_7d_quote : -1,
      fee_24h_quote: typeof poolData.fee_24h_quote === 'number' ? poolData.fee_24h_quote : -1,
      annualized_fee: typeof poolData.annualized_fee === 'number' ? poolData.annualized_fee : -1,
    };
  }).filter(poolData => !poolsFilter ||
    poolsFilter.toLowerCase() === poolData.exchange ||
    poolData.name.toLowerCase().startsWith(poolsFilter.toLowerCase()) ||
    (poolData.token_0 && ((poolData.token_0.contract_name && poolData.token_0.contract_name.toLowerCase().indexOf(poolsFilter.toLowerCase()) > -1) || (poolData.token_0.contract_ticker_symbol && poolData.token_0.contract_ticker_symbol.toLowerCase().indexOf(poolsFilter.toLowerCase()) > -1))) ||
    (poolData.token_1 && ((poolData.token_1.contract_name && poolData.token_1.contract_name.toLowerCase().indexOf(poolsFilter.toLowerCase()) > -1) || (poolData.token_1.contract_ticker_symbol && poolData.token_1.contract_ticker_symbol.toLowerCase().indexOf(poolsFilter.toLowerCase()) > -1)))
  ); // filter by user's text input

  // filter pools data on page selected
  const filteredPagePoolsData = filteredPoolsData && filteredPoolsData.filter((poolData, i) => i >= poolsPage * poolsPerPage && i < (poolsPage + 1) * poolsPerPage);

  // normalize and filter tokens data
  const filteredTokensData = tokensData && tokensData.map((tokenData, i) => {
    return {
      ...tokenData,
      rank: i,
      contract_name: tokenData.contract_name ? tokenData.contract_name : '',
      logo_url: tokenData.logo_url ? tokenData.logo_url : tokenData.contract_ticker_symbol && poolsData ? _.head(poolsData.flatMap(poolData => [poolData.token_0, poolData.token_1]).filter(_tokenData => _tokenData.contract_ticker_symbol === tokenData.contract_ticker_symbol).map(_tokenData => _tokenData.logo_url)) : null,
      total_liquidity_quote: typeof tokenData.total_liquidity_quote === 'number' ? tokenData.total_liquidity_quote : -1,
      total_volume_24h_quote: typeof tokenData.total_volume_24h_quote === 'number' ? tokenData.total_volume_24h_quote : -1,
      quote_rate: typeof tokenData.quote_rate === 'number' ? tokenData.quote_rate : -1,
    };
  }).filter(tokenData => !tokensFilter ||
    tokensFilter.toLowerCase() === tokenData.contract_address ||
    tokenData.contract_name.toLowerCase().indexOf(tokensFilter.toLowerCase()) > -1 ||
    tokenData.contract_ticker_symbol.toLowerCase().indexOf(tokensFilter.toLowerCase()) > -1
  ); // filter by user's text input

  // filter tokens data on page selected
  const filteredPageTokensData = filteredTokensData && filteredTokensData.filter((tokenData, i) => i >= tokensPage * tokensPerPage && i < (tokensPage + 1) * tokensPerPage);

  return (
    <div className="my-2 my-md-3 my-lg-4 mx-auto px-0 px-md-3 px-lg-5" style={{ maxWidth: '80rem' }}>
      {ecosystemData && ecosystemData[0] && (
        <Row className="mx-1">
          {/* liquidity chart */}
          <Col lg="6" md="12" xs="12">
            <Card className="card-chart">
              <CardHeader>
                <Row>
                  <Col lg="6" md="8" xs="8">
                    <h4 className="card-category" style={{ fontSize: '1.125rem' }}>{"Liquidity"}</h4>
                    {[typeof liquidityDateIndexFocus === 'number' && ecosystemData[0][`liquidity_chart_${liquidityTimeRange}`].length > liquidityDateIndexFocus ? ecosystemData[0][`liquidity_chart_${liquidityTimeRange}`][liquidityDateIndexFocus] : _.last(ecosystemData[0][`liquidity_chart_${liquidityTimeRange}`])].filter(data => data).map((data, key) => (
                      <div key={key}>
                        <CardTitle tag="h3" className="mb-0" style={{ fontWeight: 500 }}>
                          {typeof data.liquidity_quote === 'number' ? `$${numeral(data.liquidity_quote).format('0,0')}` : '-'}
                        </CardTitle>
                        {data.dt && (
                          <Badge color="default" pill className="mt-1" style={{ fontSize: '.75rem', fontWeight: 400 }}>
                            <Moment format="MMMM D, YYYY">{data.dt}</Moment>
                          </Badge>
                        )}
                      </div>
                    ))}
                  </Col>
                  <Col lg="6" md="4" xs="4">
                    <ButtonGroup
                      className="btn-group-toggle float-right"
                      data-toggle="buttons"
                    >
                      {timeRanges.map((timeRange, key) => (
                        <Button
                          key={key}
                          tag="label"
                          size="sm"
                          color="default"
                          onClick={() => { setLiquidityTimeRange(timeRange); setLiquidityDateIndexFocus(null); }}
                          className={classNames('btn-simple', { active: liquidityTimeRange === timeRange })}
                        >
                          {timeRange.toUpperCase()}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                <div className="chart-area">
                  <Line
                    data={{
                      labels: ecosystemData[0][`liquidity_chart_${liquidityTimeRange}`].map(data => moment(data.dt).format('DD MMM')),
                      datasets: [{ data: ecosystemData[0][`liquidity_chart_${liquidityTimeRange}`].map(data => data.liquidity_quote) }],
                    }}
                    options={{
                      scales: {
                        xAxes: [{
                          ticks: { autoSkip: true, minRotation: 0, maxRotation: 0 },
                          gridLines: {
                            drawBorder: false,
                            color: 'rgba(29,140,248,0.0)',
                            zeroLineColor: 'transparent',
                          }
                        }],
                        yAxes: [{
                          display: false,
                          type: 'logarithmic',
                          ticks: {
                            beginAtZero: false,
                            min: (ecosystemData[0][`liquidity_chart_${liquidityTimeRange}`] && ecosystemData[0][`liquidity_chart_${liquidityTimeRange}`].length > 0 ? _.minBy(ecosystemData[0][`liquidity_chart_${liquidityTimeRange}`], 'liquidity_quote').liquidity_quote : 0) * .85,
                          }
                        }]
                      },
                      layout: {
                        padding: {
                          top: 8
                        }
                      },
                      onHover: (e, elements) => {
                        if (e.type === 'mouseout') {
                          if (typeof liquidityDateIndexFocus === 'number') {
                            setLiquidityDateIndexFocus(null);
                          }
                        }
                        else if (elements.length > 0) {
                          if (liquidityDateIndexFocus !== elements[0]._index) {
                            setLiquidityDateIndexFocus(elements[0]._index);
                          }
                        }
                      }
                    }}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
          {/* volume chart */}
          <Col lg="6" md="12" xs="12">
            <Card className="card-chart">
              <CardHeader>
                <Row>
                  <Col lg="6" md="8" xs="8">
                    <h4 className="card-category" style={{ fontSize: '1.125rem' }}>{"Volume"}</h4>
                    {[typeof volumeDateIndexFocus === 'number' && ecosystemData[0][`volume_chart_${volumeTimeRange}`].length > volumeDateIndexFocus ? ecosystemData[0][`volume_chart_${volumeTimeRange}`][volumeDateIndexFocus] : _.last(ecosystemData[0][`volume_chart_${volumeTimeRange}`])].filter(data => data).map((data, key) => (
                      <div key={key}>
                        <CardTitle tag="h3" className="mb-0" style={{ fontWeight: 500 }}>
                          {typeof data.volume_quote === 'number' ? `$${numeral(data.volume_quote).format('0,0')}` : '-'}
                        </CardTitle>
                        {data.dt && (
                          <Badge color="default" pill className="mt-1" style={{ fontSize: '.75rem', fontWeight: 400 }}>
                            <Moment format="MMMM D, YYYY">{data.dt}</Moment>
                          </Badge>
                        )}
                      </div>
                    ))}
                  </Col>
                  <Col lg="6" md="4" xs="4">
                    <ButtonGroup
                      className="btn-group-toggle float-right"
                      data-toggle="buttons"
                    >
                      {timeRanges.map((timeRange, key) => (
                        <Button
                          key={key}
                          tag="label"
                          size="sm"
                          color="default"
                          onClick={() => { setVolumeTimeRange(timeRange); setVolumeDateIndexFocus(null); }}
                          className={classNames('btn-simple', { active: volumeTimeRange === timeRange })}
                        >
                          {timeRange.toUpperCase()}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                <div className="chart-area">
                  <Bar
                    data={{
                      labels: ecosystemData[0][`volume_chart_${volumeTimeRange}`].map(data => moment(data.dt).format('DD MMM')),
                      datasets: [{ data: ecosystemData[0][`volume_chart_${volumeTimeRange}`].map(data => data.volume_quote) }],
                    }}
                    options={{
                      scales: {
                        xAxes: [{
                          ticks: { autoSkip: true, minRotation: 0, maxRotation: 0 },
                          gridLines: {
                            drawBorder: false,
                            color: 'rgba(29,140,248,0.0)',
                            zeroLineColor: 'transparent',
                          }
                        }],
                        yAxes: [{
                          display: false,
                          type: 'logarithmic',
                          ticks: {
                            beginAtZero: false,
                            min: (ecosystemData[0][`volume_chart_${liquidityTimeRange}`] && ecosystemData[0][`volume_chart_${liquidityTimeRange}`].length > 0 ? _.minBy(ecosystemData[0][`volume_chart_${liquidityTimeRange}`], 'volume_quote').volume_quote : 0) * .75,
                          }
                        }]
                      },
                      onHover: (e, elements) => {
                        if (e.type === 'mouseout') {
                          if (typeof volumeDateIndexFocus === 'number') {
                            setVolumeDateIndexFocus(null);
                          }
                        }
                        else if (elements.length > 0) {
                          if (volumeDateIndexFocus !== elements[0]._index) {
                            setVolumeDateIndexFocus(elements[0]._index);
                          }
                        }
                      }
                    }}
                  />
                </div>
              </CardBody>
            </Card>
          </Col>
          {/* statistical data */}
          <Col lg="12" md="12" xs="12" className={`text-${width <= 575 ? 'center' : 'left'} mb-4`}>
            {ecosystemData && ecosystemData[0] && (
              <>
                {[_.last(ecosystemData[0][`liquidity_chart_${liquidityTimeRange}`])].filter(data => data).map((data, key) => (
                  <Badge key={key} color="dark" className="mb-2 ml-0 mr-2 p-2" style={{ fontSize: '.85rem', fontWeight: 400 }}>
                    {"Liquidity:"}&nbsp;&nbsp;
                    <span style={{ fontWeight: 600 }}>{typeof data.liquidity_quote === 'number' ? `$${numeral(data.liquidity_quote).format('0,0')}` : '-'}</span>
                  </Badge>
                ))}
                {[_.last(ecosystemData[0][`volume_chart_${volumeTimeRange}`])].filter(data => data).map((data, key) => (
                  <Badge key={key} color="dark" className="mb-2 ml-0 mr-2 p-2" style={{ fontSize: '.85rem', fontWeight: 400 }}>
                    {"Volume 24H:"}&nbsp;&nbsp;
                    <span style={{ fontWeight: 600 }}>{typeof data.volume_quote === 'number' ? `$${numeral(data.volume_quote).format('0,0')}` : '-'}</span>
                  </Badge>
                ))}
                <Badge color="dark" className="mb-2 ml-0 mr-2 p-2" style={{ fontSize: '.85rem', fontWeight: 400 }}>
                  {"Transactions 24H:"}&nbsp;&nbsp;
                  <span style={{ fontWeight: 600 }}>{typeof ecosystemData[0].total_swaps_24h === 'number' ? numeral(ecosystemData[0].total_swaps_24h).format('0,0') : '-'}</span>
                </Badge>
                <Badge color="dark" className="mb-2 ml-0 mr-2 p-2" style={{ fontSize: '.85rem', fontWeight: 400 }}>
                  {"Total Fees 24H:"}&nbsp;&nbsp;
                  <span style={{ fontWeight: 600 }}>{typeof ecosystemData[0].total_fees_24h === 'number' ? `$${numeral(ecosystemData[0].total_fees_24h).format('0,0')}` : '-'}</span>
                </Badge>
              </>
            )}
          </Col>
        </Row>
      )}
      <Row className="mt-3 mx-1">
        <Col lg="12" md="12" xs="12" className="mb-5">
          {/* pools title and filter box */}
          <Row className="mb-2">
            <Col lg="6" md="6" xs="12" className="d-flex align-items-center">
              <Link to="/pools">
                <h3 className="mb-0" style={{ fontWeight: 600 }}>{"Sushi Pools"}</h3>
              </Link>
            </Col>
            {poolsData && (
              <Col lg="6" md="6" xs="12" className="d-flex align-items-center justify-content-start justify-content-md-end mt-2 mt-md-0">
                <Input
                  placeholder="Filter by Symbol / Address"
                  onChange={e => { setPoolsFilter(e.target.value); setPoolsPage(0); }}
                  style={{ maxWidth: '20rem' }}
                />
              </Col>
            )}
          </Row>
          {/* pools table */}
          <BootstrapTable
            keyField="rank"
            bordered={false}
            noDataIndication={poolsData ? 'No Data' : <span className="d-flex align-items-center justify-content-center">{"Loading"}<Loader type="ThreeDots" color="white" width="14" height="14" className="mt-1 ml-1" /></span>}
            classes={`${width <= 1024 ? 'table-responsive ' : ''}pb-0`}
            data={!poolsData ? [] : _.orderBy(filteredPagePoolsData, [poolsSort.field || 'rank'], [poolsSort.direction])}
            columns={[
              {
                dataField: 'name',
                text: 'Name',
                headerFormatter: column => (
                  <span className={`${poolsSort.field === column.dataField ? 'text-white' : ''}`} style={{ fontWeight: poolsSort.field === column.dataField ? 700 : 500 }}>
                    {column.text}
                    {poolsSort.field === column.dataField && (
                      <span className="ml-1">
                        {poolsSort.direction === 'desc' ? <ArrowDown /> : <ArrowUp />}
                      </span>
                    )}
                  </span>
                ),
                headerEvents: {
                  onClick: (e, column) => setPoolsSort({ field: column.dataField, direction: poolsSort.field === column.dataField && poolsSort.direction === 'desc' ? 'asc' : 'desc' })
                },
                headerStyle: {
                  cursor: 'pointer',
                  minWidth: '12.5rem'
                },
                formatter: (cell, row) => (
                  <Link to={`/pools/${row.exchange}`} className="d-flex align-items-center">
                    <img src={row.token_0.logo_url} alt="" className="avatar pool-token-0" />
                    <img src={row.token_1.logo_url} alt="" className="avatar pool-token-1" />
                    <span>{cell}</span>
                  </Link>
                ),
              }, {
                dataField: 'total_liquidity_quote',
                text: 'Liquidity',
                headerAlign: 'right',
                headerFormatter: column => (
                  <span className={`${poolsSort.field === column.dataField ? 'text-white' : ''}`} style={{ fontWeight: poolsSort.field === column.dataField ? 700 : 500 }}>
                    {column.text}
                    {poolsSort.field === column.dataField && (
                      <span className="ml-1">
                        {poolsSort.direction === 'desc' ? <ArrowDown /> : <ArrowUp />}
                      </span>
                    )}
                  </span>
                ),
                headerEvents: {
                  onClick: (e, column) => setPoolsSort({ field: column.dataField, direction: poolsSort.field === column.dataField && poolsSort.direction === 'desc' ? 'asc' : 'desc' })
                },
                headerStyle: {
                  cursor: 'pointer'
                },
                align: 'right',
                formatter: cell => cell >= 0 ? `$${numeral(cell).format('0,0') !== 'NaN' ? numeral(cell).format('0,0') : 0}` : '-',
              }, {
                dataField: 'volume_24h_quote',
                text: 'Volume 24H',
                headerAlign: 'right',
                headerFormatter: column => (
                  <span className={`${poolsSort.field === column.dataField ? 'text-white' : ''}`} style={{ fontWeight: poolsSort.field === column.dataField ? 700 : 500 }}>
                    {column.text}
                    {poolsSort.field === column.dataField && (
                      <span className="ml-1">
                        {poolsSort.direction === 'desc' ? <ArrowDown /> : <ArrowUp />}
                      </span>
                    )}
                  </span>
                ),
                headerEvents: {
                  onClick: (e, column) => setPoolsSort({ field: column.dataField, direction: poolsSort.field === column.dataField && poolsSort.direction === 'desc' ? 'asc' : 'desc' })
                },
                headerStyle: {
                  cursor: 'pointer'
                },
                align: 'right',
                formatter: cell => cell >= 0 ? `$${numeral(cell).format('0,0') !== 'NaN' ? numeral(cell).format('0,0') : 0}` : '-',
              }, {
                dataField: 'volume_7d_quote',
                text: 'Volume 7D',
                headerAlign: 'right',
                headerFormatter: column => (
                  <span className={`${poolsSort.field === column.dataField ? 'text-white' : ''}`} style={{ fontWeight: poolsSort.field === column.dataField ? 700 : 500 }}>
                    {column.text}
                    {poolsSort.field === column.dataField && (
                      <span className="ml-1">
                        {poolsSort.direction === 'desc' ? <ArrowDown /> : <ArrowUp />}
                      </span>
                    )}
                  </span>
                ),
                headerEvents: {
                  onClick: (e, column) => setPoolsSort({ field: column.dataField, direction: poolsSort.field === column.dataField && poolsSort.direction === 'desc' ? 'asc' : 'desc' })
                },
                headerStyle: {
                  cursor: 'pointer'
                },
                align: 'right',
                formatter: cell => cell >= 0 ? `$${numeral(cell).format('0,0') !== 'NaN' ? numeral(cell).format('0,0') : 0}` : '-',
              }, {
                dataField: 'token_0_reserve',
                text: 'Base Reserve',
                headerFormatter: column => (
                  <span className={`${poolsSort.field === column.dataField ? 'text-white' : ''}`} style={{ fontWeight: poolsSort.field === column.dataField ? 700 : 500 }}>
                    {column.text}
                    {poolsSort.field === column.dataField && (
                      <span className="ml-1">
                        {poolsSort.direction === 'desc' ? <ArrowDown /> : <ArrowUp />}
                      </span>
                    )}
                  </span>
                ),
                headerEvents: {
                  onClick: (e, column) => setPoolsSort({ field: column.dataField, direction: poolsSort.field === column.dataField && poolsSort.direction === 'desc' ? 'asc' : 'desc' })
                },
                headerStyle: {
                  cursor: 'pointer',
                  minWidth: '10rem'
                },
                formatter: (cell, row) => (
                  <div className="d-flex align-items-center">
                    <img src={row.token_0.logo_url} alt="" className="avatar pool-token" />
                    <span>{numeral(cell).format('0,0')}&nbsp;<Link to={`/tokens/${row.token_0.contract_address}`}>{row.token_0.contract_ticker_symbol}</Link></span>
                  </div>
                ),
              }, {
                dataField: 'token_1_reserve',
                text: 'Quote Reserve',
                headerFormatter: column => (
                  <span className={`${poolsSort.field === column.dataField ? 'text-white' : ''}`} style={{ fontWeight: poolsSort.field === column.dataField ? 700 : 500 }}>
                    {column.text}
                    {poolsSort.field === column.dataField && (
                      <span className="ml-1">
                        {poolsSort.direction === 'desc' ? <ArrowDown /> : <ArrowUp />}
                      </span>
                    )}
                  </span>
                ),
                headerEvents: {
                  onClick: (e, column) => setPoolsSort({ field: column.dataField, direction: poolsSort.field === column.dataField && poolsSort.direction === 'desc' ? 'asc' : 'desc' })
                },
                headerStyle: {
                  cursor: 'pointer',
                  minWidth: '10rem'
                },
                formatter: (cell, row) => (
                  <div className="d-flex align-items-center">
                    <img src={row.token_1.logo_url} alt="" className="avatar pool-token" />
                    <span>{numeral(cell).format('0,0')}&nbsp;<Link to={`/tokens/${row.token_1.contract_address}`}>{row.token_1.contract_ticker_symbol}</Link></span>
                  </div>
                ),
              }, {
                dataField: 'fee_24h_quote',
                text: 'Fees 24H',
                headerAlign: 'right',
                headerFormatter: column => (
                  <span className={`${poolsSort.field === column.dataField ? 'text-white' : ''}`} style={{ fontWeight: poolsSort.field === column.dataField ? 700 : 500 }}>
                    {column.text}
                    {poolsSort.field === column.dataField && (
                      <span className="ml-1">
                        {poolsSort.direction === 'desc' ? <ArrowDown /> : <ArrowUp />}
                      </span>
                    )}
                  </span>
                ),
                headerEvents: {
                  onClick: (e, column) => setPoolsSort({ field: column.dataField, direction: poolsSort.field === column.dataField && poolsSort.direction === 'desc' ? 'asc' : 'desc' })
                },
                headerStyle: {
                  cursor: 'pointer'
                },
                align: 'right',
                formatter: cell => cell >= 0 ? `$${numeral(cell).format('0,0') !== 'NaN' ? numeral(cell).format('0,0') : 0}` : '-',
              }, {
                dataField: 'annualized_fee',
                text: '% Fees (Yearly)',
                headerAlign: 'right',
                headerFormatter: column => (
                  <span className={`${poolsSort.field === column.dataField ? 'text-white' : ''}`} style={{ fontWeight: poolsSort.field === column.dataField ? 700 : 500 }}>
                    {column.text}
                    {poolsSort.field === column.dataField && (
                      <span className="ml-1">
                        {poolsSort.direction === 'desc' ? <ArrowDown /> : <ArrowUp />}
                      </span>
                    )}
                  </span>
                ),
                headerEvents: {
                  onClick: (e, column) => setPoolsSort({ field: column.dataField, direction: poolsSort.field === column.dataField && poolsSort.direction === 'desc' ? 'asc' : 'desc' })
                },
                headerStyle: {
                  cursor: 'pointer'
                },
                align: 'right',
                formatter: cell => cell >= 0 ? <span className="text-green">{`${numeral(cell).format('0,0.00%') !== 'NaN' ? numeral(cell).format('0,0.00%') : '0.00%'}`}</span> : '-',
              },
            ]}
          />
          {/* pools paginations */}
          {filteredPoolsData && Math.floor(filteredPoolsData.length / perPageSizes[0]) > 0 && (
            <div className={`text-center d-${width <= 575 ? 'block' : 'flex'} align-items-center justify-content-center justify-content-md-end`}>
              {"Rows per page"}
              <ButtonDropdown direction="up" isOpen={poolsPerPageDropdownOpen} toggle={togglePoolsPerPageDropdown} className="ml-2 mr-0 mr-md-3">
                <DropdownToggle size="sm" color="default" className="dropdown-button">
                  {poolsPerPage}
                </DropdownToggle>
                <DropdownMenu>
                  {perPageSizes.map((perPageSize, key) => (
                    <DropdownItem
                      key={key}
                      disabled={poolsPerPage === perPageSize}
                      onClick={() => { setPoolsPerPage(perPageSize); setPoolsPage(0); }}
                      className={`text-${poolsPerPage === perPageSize ? 'muted' : 'dark'}`}
                      style={{ background: poolsPerPage === perPageSize ? 'rgba(0,0,0,.05)' : undefined, fontWeight: 600 }}
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
                disabled={poolsPage < 1}
                onClick={() => setPoolsPage(poolsPage - 1)}
                className="ml-0 mr-2"
              >
                <ChevronLeft />
              </Button>
              {(poolsPage * poolsPerPage) + 1}
              {" - "}
              {(poolsPage + 1) * poolsPerPage > filteredPoolsData.length ? filteredPoolsData.length : (poolsPage + 1) * poolsPerPage}
              {" of "}
              {numeral(filteredPoolsData.length).format('0,0')}
              <Button
                color="default"
                size="sm"
                disabled={(poolsPage + 1) * poolsPerPage > filteredPoolsData.length}
                onClick={() => setPoolsPage(poolsPage + 1)}
                className="ml-2"
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </Col>
        <Col lg="12" md="12" xs="12">
          {/* tokens title and filter box */}
          <Row className="mb-2">
            <Col lg="6" md="6" xs="12" className="d-flex align-items-center">
              <Link to="/tokens">
                <h3 className="mb-0" style={{ fontWeight: 600 }}>{"Top Tokens"}</h3>
              </Link>
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
            data={!tokensData ? [] : _.orderBy(filteredPageTokensData, [tokensSort.field || 'rank'], [tokensSort.direction])}
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
                    <span>{cell}</span>
                  </Link>
                ),
              }, {
                dataField: 'contract_ticker_symbol',
                text: 'Symbol',
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
                formatter: (cell, row) => (
                  <Link to={`/tokens/${row.contract_address}`} className="text-secondary d-flex align-items-center">
                    <span>{cell}</span>
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
                formatter: cell => cell >= 0 ? `$${numeral(cell).format('0,0') !== 'NaN' ? numeral(cell).format('0,0') : 0}` : '-',
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
                formatter: cell => cell >= 0 ? `$${numeral(cell).format('0,0') !== 'NaN' ? numeral(cell).format('0,0') : 0}` : '-',
              },
            ]}
          />
          {/* tokens paginations */}
          {filteredTokensData && Math.floor(filteredTokensData.length / perPageSizes[0]) > 0 && (
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
              {(tokensPage + 1) * tokensPerPage > filteredTokensData.length ? filteredTokensData.length : (tokensPage + 1) * tokensPerPage}
              {" of "}
              {numeral(filteredTokensData.length).format('0,0')}
              <Button
                color="default"
                size="sm"
                disabled={(tokensPage + 1) * tokensPerPage > filteredTokensData.length}
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

export default Dashboard;
