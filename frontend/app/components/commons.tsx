export const Side = Object.freeze({
  sell: "sell",
  buy: "buy",
});

export const Order = Object.freeze({
  limit: "limit",
  stop: "stop",
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
