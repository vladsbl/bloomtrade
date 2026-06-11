import axios from 'axios';
import { StockQuote } from '../types/quote';

// Public market-data host — no API key, no auth, intended for public consumption.
const BINANCE_BASE_URL = 'https://data-api.binance.vision';

const binanceClient = axios.create({ baseURL: BINANCE_BASE_URL });

interface Binance24hrTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  prevClosePrice: string;
  lastPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
}

/**
 * Fetch a 24h ticker for a Binance spot pair (e.g. "BTCUSDT").
 * All numeric fields arrive as strings and are parsed to numbers.
 */
export async function getBinanceQuote(apiSymbol: string): Promise<StockQuote> {
  try {
    const { data } = await binanceClient.get<Binance24hrTicker>('/api/v3/ticker/24hr', {
      params: { symbol: apiSymbol },
    });

    const currentPrice = parseFloat(data.lastPrice);
    if (!Number.isFinite(currentPrice) || currentPrice === 0) {
      throw new Error('empty');
    }

    return {
      symbol: apiSymbol,
      currentPrice,
      change: parseFloat(data.priceChange),
      percentChange: parseFloat(data.priceChangePercent),
      high: parseFloat(data.highPrice),
      low: parseFloat(data.lowPrice),
      open: parseFloat(data.openPrice),
      previousClose: parseFloat(data.prevClosePrice),
    };
  } catch (error) {
    throw new Error(`Impossible de récupérer la cotation Binance pour ${apiSymbol}.`);
  }
}
