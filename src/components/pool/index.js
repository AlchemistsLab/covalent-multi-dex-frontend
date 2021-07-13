import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { request as covalentRequest } from '../../api/covalent';
import { numberOptimizeDecimal, valueChange } from '../../utils';
import { Row, Col, NavLink, Card, CardHeader, CardTitle, CardBody, Badge, ButtonGroup, Button } from 'reactstrap';
import _ from 'lodash';
import numeral from 'numeral';
import moment from 'moment';
import Moment from 'react-moment';
import { Line, Bar } from 'react-chartjs-2';
import Chart from 'chart.js';
import classNames from 'classnames';
import { chartOptions, parseOptions } from '../../variables/charts.js';
import { Copy } from 'react-feather';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import NotificationAlert from 'react-notification-alert';
import Loader from 'react-loader-spinner';

const Pool = props => {
  // address from query string parameter
  const address = props.match && props.match.params && props.match.params.address;
  // this pool data
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
  // index of date that user cursor focus on base token's price chart
  const [priceToken0DateIndexFocus, setPriceToken0DateIndexFocus] = useState(null);
  // index of date that user cursor focus on quote token's price chart
  const [priceToken1DateIndexFocus, setPriceToken1DateIndexFocus] = useState(null);

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

  // request DEX pool: '/{chain_id}/xy=k/{dexname}/pools/address/{address}/'
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
          const response = await covalentRequest(`/${process.env.REACT_APP_CHAIN_ID}/xy=k/${process.env.REACT_APP_DEX_NAME}/pools/address/${address}/`, { 'page-number': page });
          if (response && response.data) {
            if (response.data.items) {
              for (let i = 0; i < response.data.items.length; i++) {
                data[size++] = response.data.items[i];
              }
              setPoolsData(data);
            }
            hasMore = response.data.pagination && response.data.pagination.has_more;
          }
          else {
            hasMore = false;
          }
          setLoading(false);
        } catch (error) {}
        // set first page of data loaded
        setLoaded(true);
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
    annualized_fee: _.meanBy(poolsData, 'annualized_fee'),
    total_liquidity: _.sumBy(poolsData, 'total_liquidity_quote'),
    total_volume_24h: _.sumBy(poolsData, 'volume_24h_quote'),
    total_volume_7d: _.sumBy(poolsData, 'volume_7d_quote'),
    liquidity_chart_7d: _.orderBy(Object.entries(_.groupBy(poolsData.flatMap(poolData => poolData.liquidity_timeseries_7d), 'dt')).map(entry => { return { dt: entry[0], liquidity_quote: _.sumBy(entry[1], 'liquidity_quote') }; }), ['dt'], ['asc']).filter(chartData => moment().diff(moment(chartData.dt), 'days') < 7),
    liquidity_chart_30d: _.orderBy(Object.entries(_.groupBy(poolsData.flatMap(poolData => poolData.liquidity_timeseries_30d), 'dt')).map(entry => { return { dt: entry[0], liquidity_quote: _.sumBy(entry[1], 'liquidity_quote') }; }), ['dt'], ['asc']).filter(chartData => moment().diff(moment(chartData.dt), 'days') < 30),
    volume_chart_7d: _.orderBy(Object.entries(_.groupBy(poolsData.flatMap(poolData => poolData.volume_timeseries_7d), 'dt')).map(entry => { return { dt: entry[0], volume_quote: _.sumBy(entry[1], 'volume_quote') }; }), ['dt'], ['asc']).filter(chartData => moment().diff(moment(chartData.dt), 'days') < 7),
    volume_chart_30d: _.orderBy(Object.entries(_.groupBy(poolsData.flatMap(poolData => poolData.volume_timeseries_30d), 'dt')).map(entry => { return { dt: entry[0], volume_quote: _.sumBy(entry[1], 'volume_quote') }; }), ['dt'], ['asc']).filter(chartData => moment().diff(moment(chartData.dt), 'days') < 30),
    price_token_0_chart_7d: _.orderBy(Object.entries(_.groupBy(poolsData.flatMap(poolData => poolData.price_timeseries_7d), 'dt')).map(entry => { return { dt: entry[0], price_quote: _.meanBy(entry[1], 'price_of_token0_in_quote_currency') }; }), ['dt'], ['asc']),
    price_token_1_chart_7d: _.orderBy(Object.entries(_.groupBy(poolsData.flatMap(poolData => poolData.price_timeseries_7d), 'dt')).map(entry => { return { dt: entry[0], price_quote: _.meanBy(entry[1], 'price_of_token1_in_quote_currency') }; }), ['dt'], ['asc']),
    price_token_0_chart_30d: _.orderBy(Object.entries(_.groupBy(poolsData.flatMap(poolData => poolData.price_timeseries_30d), 'dt')).map(entry => { return { dt: entry[0], price_quote: _.meanBy(entry[1], 'price_of_token0_in_quote_currency') }; }), ['dt'], ['asc']),
    price_token_1_chart_30d: _.orderBy(Object.entries(_.groupBy(poolsData.flatMap(poolData => poolData.price_timeseries_30d), 'dt')).map(entry => { return { dt: entry[0], price_quote: _.meanBy(entry[1], 'price_of_token1_in_quote_currency') }; }), ['dt'], ['asc']),
  }];

  return (
    <div className="my-2 my-md-3 my-lg-4 mx-auto px-0 px-md-3 px-lg-5" style={{ maxWidth: '80rem' }}>
      {/* notification component */}
      <div className="react-notification-alert-container copy">
        <NotificationAlert ref={notificationAlertRef} />
      </div>
      <Row className="mb-3 mx-1">
        {/* pair information */}
        <Col lg="6" md="7" xs="12">
          {poolsData && poolsData.filter(poolData => poolData.token_0 && poolData.token_1).map((poolData, key) => (
            <div key={key} className="d-flex align-items-center">
              <img src={poolData.token_0.logo_url} alt="" className="avatar pool-token-0 token" />
              <img src={poolData.token_1.logo_url} alt="" className="avatar pool-token-1 token" />
              <div>
                <div>
                  <span className="mr-2">{poolData.token_0.contract_name}{'/'}{poolData.token_1.contract_name}</span>
                  <Badge color="dark" className="ml-0" style={{ fontSize: '.75rem', fontWeight: 400 }}>{poolData.token_0.contract_ticker_symbol}{'-'}{poolData.token_1.contract_ticker_symbol}</Badge>
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
            </div>
          ))}
        </Col>
        {/* link to go to do actions on DEX and etherscan.io */}
        <Col lg="6" md="5" xs="12" className="d-flex align-items-center justify-content-start justify-content-md-end">
          {poolsData && poolsData[0] && poolsData[0].token_0 && poolsData[0].token_1 && (
            <>
              <NavLink href={`https://exchange.sushiswapclassic.org/#/add/${poolsData[0].token_0.contract_address}/${poolsData[0].token_1.contract_address}`} target="_blank" rel="noopener noreferrer" className="pl-0 pl-md-2 pr-2">{"Add Liquidity"}</NavLink>
              <NavLink href={`https://exchange.sushiswapclassic.org/#/swap?inputCurrency=${poolsData[0].token_0.contract_address}&outputCurrency=${poolsData[0].token_1.contract_address}`} target="_blank" rel="noopener noreferrer" className="px-2">{"Trade"}</NavLink>
            </>
          )}
          <NavLink href={`https://etherscan.io/address/${address}`} target="_blank" rel="noopener noreferrer" className="px-2">{"Etherscan"}</NavLink>
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
                <Badge color="dark" className="mb-2 ml-0 mr-2 p-2" style={{ fontSize: '.85rem', fontWeight: 400 }}>
                  {"Liquidity:"}&nbsp;&nbsp;
                  <span style={{ fontWeight: 600 }}>{typeof ecosystemData[0].total_liquidity === 'number' ? `$${numeral(ecosystemData[0].total_liquidity).format('0,0')}` : '-'}</span>
                </Badge>
                <Badge color="dark" className="mb-2 ml-0 mr-2 p-2" style={{ fontSize: '.85rem', fontWeight: 400 }}>
                  {"Volume 24H:"}&nbsp;&nbsp;
                  <span style={{ fontWeight: 600 }}>{typeof ecosystemData[0].total_volume_24h === 'number' ? `$${numeral(ecosystemData[0].total_volume_24h).format('0,0')}` : '-'}</span>
                </Badge>
                <Badge color="dark" className="mb-2 ml-0 mr-2 p-2" style={{ fontSize: '.85rem', fontWeight: 400 }}>
                  {"Volume 7D:"}&nbsp;&nbsp;
                  <span style={{ fontWeight: 600 }}>{typeof ecosystemData[0].total_volume_7d === 'number' ? `$${numeral(ecosystemData[0].total_volume_7d).format('0,0')}` : '-'}</span>
                </Badge>
                <Badge color="dark" className="mb-2 ml-0 mr-2 p-2" style={{ fontSize: '.85rem', fontWeight: 400 }}>
                  {"Transactions 24H:"}&nbsp;&nbsp;
                  <span style={{ fontWeight: 600 }}>{typeof ecosystemData[0].total_swaps_24h === 'number' ? numeral(ecosystemData[0].total_swaps_24h).format('0,0') : '-'}</span>
                </Badge>
                <Badge color="dark" className="mb-2 ml-0 mr-2 p-2" style={{ fontSize: '.85rem', fontWeight: 400 }}>
                  {"Total Fees 24H:"}&nbsp;&nbsp;
                  <span style={{ fontWeight: 600 }}>{typeof ecosystemData[0].total_fees_24h === 'number' ? `$${numeral(ecosystemData[0].total_fees_24h).format('0,0')}` : '-'}</span>
                </Badge>
                <Badge color="dark" className="mb-2 ml-0 mr-2 p-2" style={{ fontSize: '.85rem', fontWeight: 400 }}>
                  {"% Fees (Yearly):"}&nbsp;&nbsp;
                  <span className="text-green" style={{ fontWeight: 600 }}>{numeral(ecosystemData[0].annualized_fee).format('0,0.00%') !== 'NaN' ? numeral(ecosystemData[0].annualized_fee).format('0,0.00%') : '0.00%'}</span>
                </Badge>
              </>
            )}
          </Col>
        </Row>
      )}
      <Row className="mt-3 mx-1">
        <Col lg="12" md="12" xs="12">
          {/* pool's tokens title */}
          <Row className="mb-2">
            <Col lg="12" md="12" xs="12" className="d-flex align-items-center">
              <h3 className="d-flex align-items-center mb-0" style={{ fontWeight: 600 }}>
                {"Tokens"}
                {!fullLoaded && loading && (<Loader type="Oval" color="white" width="24" height="24" className="ml-2" style={{ marginTop: '-.25rem' }} />)}
              </h3>
            </Col>
          </Row>
          {/* base token & quote token data */}
          <Row className="mt-3">
            {poolsData && poolsData.map(poolData => (
              [...Array(2).keys()].map((iToken, key) => (
                <Col key={key} lg="6" md="12" xs="12">
                  <Card className="card-chart p-3">
                    {/* each token information */}
                    <CardHeader>
                      <div className="d-flex align-items-center">
                        <Link to={`/tokens/${poolData[`token_${iToken}`].contract_address}`}>
                          <img src={poolData[`token_${iToken}`].logo_url} alt="" className="avatar token mb-0 mr-2" />
                        </Link>
                        <div className="mr-2">
                          <Link to={`/tokens/${poolData[`token_${iToken}`].contract_address}`}>
                            <span className="mr-2">{poolData[`token_${iToken}`].contract_name}</span>
                            <Badge color="dark" className="ml-0" style={{ fontSize: '.75rem', fontWeight: 400 }}>{poolData[`token_${iToken}`].contract_ticker_symbol}</Badge>
                          </Link>
                          <CopyToClipboard text={poolData[`token_${iToken}`].contract_address}>
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
                              {poolData[`token_${iToken}`].contract_address.length > 13 ? `${poolData[`token_${iToken}`].contract_address.substring(0, 6)}...${poolData[`token_${iToken}`].contract_address.substring(poolData[`token_${iToken}`].contract_address.length - 7)}` : poolData[`token_${iToken}`].contract_address}
                              <Copy className="text-white ml-2" style={{ width: '.85rem', height: '.85rem', marginTop: '-.25rem' }} />
                            </div>
                          </CopyToClipboard>
                        </div>
                        <div className="ml-auto">
                          <span className="text-white" style={{ fontWeight: 600 }}>{poolData[`token_${iToken}`].quote_rate >= 0 ? `$${numberOptimizeDecimal(numeral(poolData[`token_${iToken}`].quote_rate).format(`0,0.00${poolData[`token_${iToken}`].quote_rate >= 1 ? '' : '00000000'}`))}` : '-'}</span>
                          {ecosystemData && ecosystemData[0] && [valueChange(ecosystemData[0][`price_token_${iToken}_chart_7d`], 'price_quote', 'dt', true)].filter(data => data !== 0).map((data, key) => (
                            <div key={key} className={`text-right text-${data < 0 ? 'red' : 'green'}`} style={{ fontSize: '.75rem' }}>
                              {numeral(data).format('+0,0.00%')}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardBody className="py-3 px-0">
                      {/* num token reserved and liquidity rate */}
                      <div className="mt-4">
                        <div className="text-muted text-center" style={{ fontSize: '.85rem', fontWeight: 300 }}>{iToken === 0 ? 'Base' : 'Quote'}&nbsp;{"Reserve"}</div>
                        <h1 className="text-center mt-3 mb-0" style={{ fontWeight: 600 }}>{numeral(poolData[`token_${iToken}`].reserve / Math.pow(10, poolData[`token_${iToken}`].contract_decimals)).format('0,0')}{" "}{poolData[`token_${iToken}`].contract_ticker_symbol}</h1>
                        <div className="text-muted text-center mt-2" style={{ fontSize: '1rem', fontWeight: 300 }}>{"1 "}{poolData[`token_${iToken}`].contract_ticker_symbol}{" = "}{numberOptimizeDecimal(numeral((poolData[`token_${iToken === 0 ? 1 : 0}`].reserve / Math.pow(10, poolData[`token_${iToken === 0 ? 1 : 0}`].contract_decimals)) / (poolData[`token_${iToken}`].reserve / Math.pow(10, poolData[`token_${iToken}`].contract_decimals))).format('0,0.00000000'))}{" "}{poolData[`token_${iToken === 0 ? 1 : 0}`].contract_ticker_symbol}</div>
                      </div>
                      {/* price chart */}
                      <Row className="mt-4 mx-0">
                        <Col lg="12" md="12" xs="12" className="text-right">
                          <h4 className="card-category mb-0" style={{ fontSize: '1rem' }}>{"Price"}</h4>
                          {[typeof (iToken === 0 ? priceToken0DateIndexFocus : priceToken1DateIndexFocus) === 'number' && ecosystemData[0][`price_token_${iToken}_chart_30d`].length > (iToken === 0 ? priceToken0DateIndexFocus : priceToken1DateIndexFocus) ? ecosystemData[0][`price_token_${iToken}_chart_30d`][iToken === 0 ? priceToken0DateIndexFocus : priceToken1DateIndexFocus] : _.last(ecosystemData[0][`price_token_${iToken}_chart_30d`])].filter(data => data).map((data, key) => (
                            <div key={key}>
                              <CardTitle tag="h3" className="mb-0" style={{ fontWeight: 500 }}>
                                {typeof data.price_quote === 'number' ? `$${numeral(data.price_quote).format(`0,0.00${data.price_quote >= 1 ? '' : '00000000'}`)}` : '-'}
                              </CardTitle>
                              {data.dt && (
                                <Badge color="default" pill className="mt-1" style={{ fontSize: '.75rem', fontWeight: 400 }}>
                                  <Moment format="MMMM D, YYYY">{data.dt}</Moment>
                                </Badge>
                              )}
                            </div>
                          ))}
                        </Col>
                      </Row>
                      <div className="">
                        <Line
                          data={() => {
                            const change = valueChange(ecosystemData[0][`price_token_${iToken}_chart_7d`], 'price_quote', 'dt', true);
                            const green = 'rgb(39,174,96)';
                            const lightGreen = 'rgb(39,174,96,.25)';
                            const red = 'rgb(244,67,54)';
                            const lightRed = 'rgb(244,67,54,.25)';
                            return {
                              labels: ecosystemData[0][`price_token_${iToken}_chart_30d`].map(data => moment(data.dt).format('DD MMM')),
                              datasets: [{
                                data: ecosystemData[0][`price_token_${iToken}_chart_30d`].map(data => data.price_quote),
                                borderColor: change < 0 ? red : green,
                                backgroundColor: change < 0 ? lightRed : lightGreen,
                                pointBackgroundColor: change < 0 ? red : green,
                                pointBorderColor: change < 0 ? red : green,
                              }],
                            };
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
                                ticks: {
                                  beginAtZero: false,
                                },
                              }]
                            },
                            layout: {
                              padding: {
                                top: 4
                              }
                            },
                            onHover: (e, elements) => {
                              if (e.type === 'mouseout') {
                                if (typeof (iToken === 0 ? priceToken0DateIndexFocus : priceToken1DateIndexFocus) === 'number') {
                                  if (iToken === 0) {
                                    setPriceToken0DateIndexFocus(null);
                                  }
                                  else {
                                    setPriceToken1DateIndexFocus(null);
                                  }
                                }
                              }
                              else if (elements.length > 0) {
                                if ((iToken === 0 ? priceToken0DateIndexFocus : priceToken1DateIndexFocus) !== elements[0]._index) {
                                  if (iToken === 0) {
                                    setPriceToken0DateIndexFocus(elements[0]._index);
                                  }
                                  else {
                                    setPriceToken1DateIndexFocus(elements[0]._index);
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              ))
            ))}
          </Row>
        </Col>
      </Row>
    </div>
  );
}

export default Pool;
