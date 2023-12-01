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
