export const Side = Object.freeze({
  sell: "sell",
  buy: "buy",
});

export const Order = Object.freeze({
  limit: "limit",
  stopLoss: "stop-loss",
  stopLossLimit: "stop-loss-limit",
  takeProfit: "take-profit",
  takeProfitLimit: "take-profit-limit",
  market: "market",
});

export type OrderType = keyof typeof Order;
export type SideType = keyof typeof Side;

export const Leverage = {
  "MATIC/USD": 4,
};

export const DefaultVolume = {
  "MATIC/USD": 40,
};

export enum LogLevel {
  INFO = 0,
  WARNING = 1,
  ERROR = 2,
}

export type Message = {
  text: string;
  time: string;
  level: LogLevel;
};

export function noop() {}

export type BookPriceType = {
  price: number;
  bid: number;
  ask: number;
  ask_ps: number;
  bid_ps: number;
};

export type BookDataType = {
  depth: number;
  data: [BookPriceType];
  pair: string;
  ask_volume_total: number;
  bid_volume_total: number;
  ask_volume_total_percentage: number;
  bids_volume_total_percentage: number;
  peg_price: number;
  price_decimals: number;
  qty_decimals: number;
  checksum: number;
  best_bid: number;
  best_ask: number;
};

export type TradeResponseType = {
  type: SideType;
  vol: number;
  cost: number;
  leverage: number;
  pair: string;
};

export type TradeResponseExtendedType = {
  type: SideType;
  vol: number;
  cost: number;
  leverage: number;
  pair: string;
  entryPrice: number;
};

export type OrderResponseType = {
  id: string;
  value: { opentm: number; descr: { order: string; type: "sell" | "buy" } };
};

export const WATCH_PAIRS = ["MATIC/USD", "BTC/USD"];

export const INTERVALS = [1, 5, 15, 30, 60, 240, 1440, 10080, 21600];

export const INTERVALS_LABELS = {
  1: "1 min",
  5: "5 min",
  15: "15 min",
  30: "30 min",
  60: "1 hour",
  240: "4 hour",
  1440: "1 day",
  10080: "1 week",
  21600: "15 days",
};

type CandlestickEntry = { x: number; y: [number] };
type VolumeEntry = { x: number; y: number };
type TradesCountEntry = { x: number; y: number };
type VWapEntry = { x: number; y: number };

export type OHLCResponseType = {
  candlestick: [CandlestickEntry];
  volume: [VolumeEntry];
  trade_count: [TradesCountEntry];
  vwap: [VWapEntry];
};
