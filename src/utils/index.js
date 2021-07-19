import _ from 'lodash';

// DEXs configuration
export const dexs = [
	{
		chain_id: 1,
		dex_name: 'sushiswap',
		title: 'SushiSwap',
		logo_url: 'https://sushi.com/favicon.ico',
		symbol: 'SUSHI',
		gas_symbol: 'ETH',
		liquidity_url: 'https://exchange.sushiswapclassic.org/#/add/{token_0}/{token_1}',
		liquidity_input_only_url: 'https://exchange.sushiswapclassic.org/#/add/{token_0}/ETH',
		swap_url: 'https://exchange.sushiswapclassic.org/#/swap?inputCurrency={token_0}&outputCurrency={token_1}',
		swap_input_only_url: 'https://exchange.sushiswapclassic.org/#/swap?inputCurrency={token_0}',
		explorer: {
			url: 'https://etherscan.io',
			title: 'Etherscan',
			block_route: '/block/{block}',
			address_route: '/address/{address}',
			token_route: '/token/{address}',
		},
	},
	{
		chain_id: 137,
		dex_name: 'quickswap',
		title: 'QuickSwap',
		logo_url: 'https://quickswap.exchange/logo_circle.png',
		symbol: 'QUICK',
		gas_symbol: 'MATIC',
		liquidity_url: 'https://quickswap.exchange/#/add/{token_0}/{token_1}',
		liquidity_input_only_url: 'https://quickswap.exchange/#/add/{token_0}/ETH',
		swap_url: 'https://quickswap.exchange/#/swap?inputCurrency={token_0}&outputCurrency={token_1}',
		swap_input_only_url: 'https://quickswap.exchange/#/swap?inputCurrency={token_0}',
		explorer: {
			url: 'https://polygonscan.com',
			title: 'Polygon Scan',
			block_route: '/block/{block}',
			address_route: '/address/{address}',
			token_route: '/token/{address}',
		},
	},
	{
		chain_id: 43114,
		dex_name: 'pangolin',
		title: 'Pangolin',
		logo_url: 'https://app.pangolin.exchange/favicon.png',
		symbol: 'PNG',
		gas_symbol: 'AVAX',
		liquidity_url: 'https://app.pangolin.exchange/#/add/{token_0}/{token_1}',
		liquidity_input_only_url: 'https://app.pangolin.exchange/#/add/{token_0}/ETH',
		swap_url: 'https://app.pangolin.exchange/#/swap?inputCurrency={token_0}&outputCurrency={token_1}',
		swap_input_only_url: 'https://app.pangolin.exchange/#/swap?inputCurrency={token_0}',
		explorer: {
			url: 'https://avascan.info',
			title: 'AVASCAN',
			block_route: '/blockchain/c/block/{block}',
			address_route: '/blockchain/c/address/{address}',
			token_route: '/blockchain/c/token/{address}',
		},
	},
	{
		chain_id: 250,
		dex_name: 'spiritswap',
		title: 'SpiritSwap',
		logo_url: 'https://app.spiritswap.finance/images/farms/spirit.png',
		symbol: 'SPIRIT',
		gas_symbol: 'FTM',
		liquidity_url: 'https://swap.spiritswap.finance/#/add/{token_0}/{token_1}',
		liquidity_input_only_url: 'https://swap.spiritswap.finance/#/add/{token_0}/FTM',
		swap_url: 'https://swap.spiritswap.finance/#/swap?inputCurrency={token_0}&outputCurrency={token_1}',
		swap_input_only_url: 'https://swap.spiritswap.finance/#/swap?inputCurrency={token_0}',
		explorer: {
			url: 'https://ftmscan.com',
			title: 'FTMScan',
			block_route: '/block/{block}',
			address_route: '/address/{address}',
			token_route: '/token/{address}',
		},
	},
	{
		chain_id: 250,
		dex_name: 'spookyswap',
		title: 'SpookySwap',
		logo_url: 'https://spookyswap.finance/favicon.ico',
		symbol: 'BOO',
		gas_symbol: 'FTM',
		liquidity_url: 'https://spookyswap.finance/add/{token_0}/{token_1}',
		liquidity_input_only_url: 'https://spookyswap.finance/add/{token_0}/ETH',
		swap_url: 'https://spookyswap.finance/swap?inputCurrency={token_0}&outputCurrency={token_1}',
		swap_input_only_url: 'https://spookyswap.finance/swap?inputCurrency={token_0}',
		explorer: {
			url: 'https://ftmscan.com',
			title: 'FTMScan',
			block_route: '/block/{block}',
			address_route: '/address/{address}',
			token_route: '/token/{address}',
		},
	},
];

// function for remove decimals end with 000...
export const numberOptimizeDecimal = number => {
	if (typeof number === 'number') {
		number = number.toString();
	}
	if (number === 'NaN') {
		return '<0.00000001';
	}
	if (typeof number === 'string') {
		if (number.indexOf('.') > -1) {
			let decimal = number.substring(number.indexOf('.') + 1);
			while (decimal.endsWith('0')) {
				decimal = decimal.substring(0, decimal.length - 1);
			}
			if (number.substring(0, number.indexOf('.')).length >= 7 && decimal.length > 2 && !isNaN(`0.${decimal}`)) {
				decimal = Number(`0.${decimal}`).toFixed(2).toString();
				if (decimal.indexOf('.') > -1) {
					decimal = decimal.substring(decimal.indexOf('.') + 1);
					while (decimal.endsWith('0')) {
						decimal = decimal.substring(0, decimal.length - 1);
					}
				}
			}
			return `${number.substring(0, number.indexOf('.'))}${decimal ? '.' : ''}${decimal}`;
		}
		return number;
	}
	return '';
};

/***************
 * function for calculate change from list of object
 * - sort by key
 * - calculate from value
 * - support % change
 ***************/
export const valueChange = (data, valueField, sortedKeyField, isPercent) => {
	if (!(data && data.length > 1 && valueField)) {
		return 0;
	}
	data = _.cloneDeep(data);
	const _data = _.slice(_.orderBy(data.map((d, i) => { return { ...d, i, value_for_sum: d[valueField] * (i < data.length - 1 ? -1 : 1) }; }), [sortedKeyField || 'i'], ['desc']), 0, 2);
	return _.last(_data)[valueField] > 0 ? _.sumBy(_data, 'value_for_sum') / (isPercent ? _.last(_data)[valueField] : 1) : 0;
};