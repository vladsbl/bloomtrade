export type Currency = 'USD' | 'EUR';

export const CURRENCIES: Currency[] = ['USD', 'EUR'];

// Prefix symbol shown before amounts, e.g. "$120" / "€110".
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
};
