import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { request as covalentRequest } from '../../api/covalent';
import { numberOptimizeDecimal, valueChange } from '../../utils';
import { Row, Col, NavLink, Card, CardHeader, CardTitle, CardBody, Badge, ButtonGroup, Button, Input, ButtonDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import _ from 'lodash';
import numeral from 'numeral';
import moment from 'moment';
import Moment from 'react-moment';
import { Line, Bar } from 'react-chartjs-2';
import Chart from 'chart.js';
import classNames from 'classnames';
import { chartOptions, parseOptions } from '../../variables/charts.js';
import BootstrapTable from 'react-bootstrap-table-next';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Copy } from 'react-feather';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import NotificationAlert from 'react-notification-alert';
import Loader from 'react-loader-spinner';

const Token = props => {
  // address from query string parameter
  const address = props.match && props.match.params && props.match.params.address;
  // token's pools data
  const [poolsData, setPoolsData] = useState([]);
  // first page of data loaded parameter
  const [loaded, setLoaded] = useState(false);
  // first time all page of data loaded parameter
  const [fullLoaded, setFullLoaded] = useState(false);
  // loading data state
  const [loading, setLoading] = useState(false);

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
  const [poolsPerPage, setPoolsPerPage] = useState(10);
  // state of num pools per page dropdown open
  const [poolsPerPageDropdownOpen, setPoolsPerPageDropdownOpen] = useState(false);
  // toggle function of num pools per page dropdown
  const togglePoolsPerPageDropdown = () => setPoolsPerPageDropdownOpen(!poolsPerPageDropdownOpen);
  // pools table page selected
  const [poolsPage, setPoolsPage] = useState(0);

  // notification reference
  const notificationAlertRef = useRef(null);

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

  // request DEX token's pools: '/{chain_id}/xy=k/{dexname}/tokens/address/{address}/'
  useEffect(() => {
    const getData = async () => {
      const data = poolsData ? poolsData : [];
      // start pagination
      let size = 0;
      let page = 0;
      let hasMore = true;
      while (hasMore) {
        try {
          setLoading(true);
          const response = await covalentRequest(`/${process.env.REACT_APP_CHAIN_ID}/xy=k/${process.env.REACT_APP_DEX_NAME}/tokens/address/${address}/`, { 'page-number': page });
          if (response && response.data) {
            if (response.data.items) {
              for (let i = 0; i < response.data.items.length; i++) {
                data[size++] = response.data.items[i];
              }
              setPoolsData(data);
              // set first page of data loaded
              setLoaded(true);
            }
            hasMore = response.data.pagination && response.data.pagination.has_more;
          }
          else {
            hasMore = false;
          }
          setLoading(false);
        } catch (error) {}
        page++;
      }
      // end pagination
      data.length = size;
      setPoolsData(data);
      // set first time all page of data loaded
      setFullLoaded(true);
    };
    getData();
    // interval request (60 sec)
    const interval = setInterval(() => getData(), 60 * 1000);
    return () => clearInterval(interval);
  }, [address, poolsData]);

  // ecosystem data from each dimension aggregation
  const ecosystemData = poolsData && [{
    total_swaps_24h: _.sumBy(poolsData, 'swap_count_24h'),
    total_fees_24h: _.sumBy(poolsData, 'fee_24h_quote'),
    liquidity_chart_7d: _.orderBy(Object.entries(_.groupBy(poolsData.flatMap(poolData => poolData.liquidity_timeseries_7d), 'dt')).map(entry => { return { dt: entry[0], liquidity_quote: _.sumBy(entry[1], 'liquidity_quote') }; }), ['dt'], ['asc']).filter(chartData => moment().diff(moment(chartData.dt), 'days') < 7),
    liquidity_chart_30d: _.orderBy(Object.entries(_.groupBy(poolsData.flatMap(poolData => poolData.liquidity_timeseries_30d), 'dt')).map(entry => { return { dt: entry[0], liquidity_quote: _.sumBy(entry[1], 'liquidity_quote') }; }), ['dt'], ['asc']).filter(chartData => moment().diff(moment(chartData.dt), 'days') < 30),
    volume_chart_7d: _.orderBy(Object.entries(_.groupBy(poolsData.flatMap(poolData => poolData.volume_timeseries_7d), 'dt')).map(entry => { return { dt: entry[0], volume_quote: _.sumBy(entry[1], 'volume_quote') }; }), ['dt'], ['asc']).filter(chartData => moment().diff(moment(chartData.dt), 'days') < 7),
    volume_chart_30d: _.orderBy(Object.entries(_.groupBy(poolsData.flatMap(poolData => poolData.volume_timeseries_30d), 'dt')).map(entry => { return { dt: entry[0], volume_quote: _.sumBy(entry[1], 'volume_quote') }; }), ['dt'], ['asc']).filter(chartData => moment().diff(moment(chartData.dt), 'days') < 30),
    price_chart_7d: _.orderBy(Object.entries(_.groupBy(poolsData.filter(poolData => poolData.token_0 && poolData.token_1).filter(poolData => poolData.token_0.contract_address === address || poolData.token_1.contract_address === address).flatMap(poolData => poolData.price_timeseries_7d.map(priceData => { return { ...priceData, price_quote: poolData.token_1.contract_address === address ? priceData.price_of_token1_in_quote_currency : priceData.price_of_token0_in_quote_currency }; })), 'dt')).map(entry => { return { dt: entry[0], price_quote: _.meanBy(entry[1], 'price_quote') }; }), ['dt'], ['asc']),
  }];

  // normalize and filter pools data
  const filterredPoolsData = poolsData && poolsData.filter(poolData => poolData.token_0 && poolData.token_1).map((poolData, i) => {
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
  const filterredPagePoolsData = filterredPoolsData && filterredPoolsData.filter((poolData, i) => i >= poolsPage * poolsPerPage && i < (poolsPage + 1) * poolsPerPage);

  return (
    <div className="my-2 my-md-3 my-lg-4 mx-auto px-0 px-md-3 px-lg-5" style={{ maxWidth: '80rem' }}>
      {/* notification component */}
      <div className="react-notification-alert-container copy">
        <NotificationAlert ref={notificationAlertRef} />
      </div>
      <Row className="mb-3 mx-1">
        {/* token information */}
        <Col lg="6" md="7" xs="12">
          {poolsData && _.slice(poolsData.filter(poolData => poolData.token_0 && poolData.token_1).flatMap(poolData => [poolData.token_0, poolData.token_1]).filter(tokenData => tokenData.contract_address === address), 0, 1).map((tokenData, key) => (
            <div key={key} className="d-flex align-items-center">
              <img src={tokenData.logo_url} alt="" className="avatar token mr-2" />
              <div className="mr-2">
                <div>
                  <span className="mr-2">{tokenData.contract_name}</span>
                  <Badge color="dark" className="ml-0" style={{ fontSize: '.75rem', fontWeight: 400 }}>{tokenData.contract_ticker_symbol}</Badge>
                </div>
                <CopyToClipboard text={address}>
                  <div
                    onClick={() => notificationAlertRef.current.notificationAlert({
                      place: 'tc',
                      message: 'Copied!',
                      type: 'info',
                      icon: "tim-icons icon-check-2",
                      autoDismiss: .125,
                    })}
                    className="text-muted mt-1"
                    style={{ fontSize: '.75rem', fontWeight: 300, cursor: 'pointer' }}
                  >
                    {address.length > 13 ? `${address.substring(0, 6)}...${address.substring(address.length - 7)}` : address}
                    <Copy className="text-white ml-2" style={{ width: '.85rem', height: '.85rem', marginTop: '-.25rem' }} />
                  </div>
                </CopyToClipboard>
              </div>
              <div className="ml-auto">
                <span className="text-white" style={{ fontWeight: 600 }}>{tokenData.quote_rate >= 0 ? `$${numberOptimizeDecimal(numeral(tokenData.quote_rate).format(`0,0.00${tokenData.quote_rate >= 1 ? '' : '00000000'}`))}` : '-'}</span>
                {ecosystemData && ecosystemData[0] && [valueChange(ecosystemData[0].price_chart_7d, 'price_quote', 'dt', true)].filter(data => data !== 0).map((data, key) => (
                  <div key={key} className={`text-right text-${data < 0 ? 'red' : 'green'}`} style={{ fontSize: '.75rem' }}>
                    {numeral(data).format('+0,0.00%')}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Col>
        {/* link to go to do actions on DEX and etherscan.io */}
        <Col lg="6" md="5" xs="12" className="d-flex align-items-center justify-content-start justify-content-md-end">
          <NavLink href={`https://exchange.sushiswapclassic.org/#/add/${address}/ETH`} target="_blank" rel="noopener noreferrer" className="pl-0 pl-md-2 pr-2">{"Add Liquidity"}</NavLink>
          <NavLink href={`https://exchange.sushiswapclassic.org/#/swap?inputCurrency=${address}`} target="_blank" rel="noopener noreferrer" className="px-2">{"Trade"}</NavLink>
          <NavLink href={`https://etherscan.io/token/${address}`} target="_blank" rel="noopener noreferrer" className="px-2">{"Etherscan"}</NavLink>
        </Col>
      </Row>
      {loaded && ecosystemData && ecosystemData[0] && (
        <Row className="mt-3 mx-1">
          {/* liquidity chart */}
          <Col lg="6" md="12" xs="12">
            <Card className="card-chart">
              <CardHeader>
                <Row>
                  <Col lg="6" md="8" xs="8">
                    <h4 className="card-category d-flex align-items-center" style={{ fontSize: '1.125rem' }}>
                      {"Liquidity"}
                      {!fullLoaded && loading && (<Loader type="Oval" color="white" width="18" height="18" className="ml-2" style={{ marginTop: '-.125rem' }} />)}
                    </h4>
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
                    <h4 className="card-category d-flex align-items-center" style={{ fontSize: '1.125rem' }}>
                      {"Volume"}
                      {!fullLoaded && loading && (<Loader type="Oval" color="white" width="18" height="18" className="ml-2" style={{ marginTop: '-.125rem' }} />)}
                    </h4>
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
        <Col lg="12" md="12" xs="12">
          {/* token's pools title and filter box */}
          <Row className="mb-2">
            <Col lg="6" md="6" xs="12" className="d-flex align-items-center">
              <h3 className="d-flex align-items-center mb-0" style={{ fontWeight: 600 }}>
                {"Pools"}
                {!fullLoaded && loading && (<Loader type="Oval" color="white" width="24" height="24" className="ml-2" style={{ marginTop: '-.25rem' }} />)}
              </h3>
            </Col>
            {loaded && poolsData && (
              <Col lg="6" md="6" xs="12" className="d-flex align-items-center justify-content-start justify-content-md-end mt-2 mt-md-0">
                <Input
                  placeholder="Filter by Symbol / Address"
                  onChange={e => { setPoolsFilter(e.target.value); setPoolsPage(0); }}
                  style={{ maxWidth: '20rem' }}
                />
              </Col>
            )}
          </Row>
          {/* token's pools table */}
          <BootstrapTable
            keyField="rank"
            bordered={false}
            noDataIndication={loaded && poolsData ? 'No Data' : <span className="d-flex align-items-center justify-content-center">{"Loading"}<Loader type="ThreeDots" color="white" width="14" height="14" className="mt-1 ml-1" /></span>}
            classes={`${width <= 1024 ? 'table-responsive ' : ''}pb-0`}
            data={!poolsData ? [] : _.orderBy(filterredPagePoolsData, [poolsSort.field || 'rank'], [poolsSort.direction])}
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
                    <span>{numeral(cell).format('0,0')}&nbsp;<a href={`/tokens/${row.token_0.contract_address}`}>{row.token_0.contract_ticker_symbol}</a></span>
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
                    <span>{numeral(cell).format('0,0')}&nbsp;<a href={`/tokens/${row.token_1.contract_address}`}>{row.token_1.contract_ticker_symbol}</a></span>
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
          {/* token's pools paginations */}
          {filterredPoolsData && Math.floor(filterredPoolsData.length / perPageSizes[0]) > 0 && (
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
              {(poolsPage + 1) * poolsPerPage > filterredPoolsData.length ? filterredPoolsData.length : (poolsPage + 1) * poolsPerPage}
              {" of "}
              {numeral(filterredPoolsData.length).format('0,0')}
              <Button
                color="default"
                size="sm"
                disabled={(poolsPage + 1) * poolsPerPage > filterredPoolsData.length}
                onClick={() => setPoolsPage(poolsPage + 1)}
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

export default Token;
