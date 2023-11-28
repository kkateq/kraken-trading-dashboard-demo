export const Side = Object.freeze({
  sell: "sell",
  buy: "buy",
});

export const Order = Object.freeze({
  limit: "limit",
  stop: "stop",
  market: "market",
});

export type OrderType = keyof typeof Order;
export type SideType = keyof typeof Side;

export const Leverage = {
  "MATIC/USD": 4,
};
