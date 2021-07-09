import _ from 'lodash';

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