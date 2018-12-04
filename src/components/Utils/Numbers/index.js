import numbro from 'numbro';

const options = {
  thousandSeparated: true,
}

export const formatNumber = number => numbro(number).format(options);
