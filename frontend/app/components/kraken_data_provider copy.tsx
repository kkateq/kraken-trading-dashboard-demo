"use client";

import {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import moment from "moment";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
  OrderType,
  Order,
  SideType,
  LogLevel,
  Message,
  noop,
  BookDataType,
  TradeResponseExtendedType,
  TradeResponseType,
  OrderResponseType,
  WATCH_PAIRS,
  Side,
  Leverage,
} from "./commons";
// import { debounce, throttle } from "lodash";
// import { useThrottle } from "@uidotdev/usehooks";
import { Spinner } from "@material-tailwind/react";

type KrakenDataContextType = {
  addOrder: (ordertype: OrderType, side: SideType, price: number) => void;
  flattenTrade: (trade: TradeResponseExtendedType) => void;
  closeTrade: (trade: TradeResponseExtendedType) => void;
  cancelOrder: (id: string) => void;
  cancelAllPendingOrders: () => void;
  logMessages: Message[];
  fetchOrders: () => void;
  fetchTrades: () => void;
  trades: TradeResponseExtendedType[];
  orders: OrderResponseType[];
  totalTradesCount: {
    total: number;
    sells: number;
    buys: number;
  };
  closeAllTrades: () => void;
  flattenAllTrades: () => void;
  addLogMessage: (message: string, level: LogLevel) => void;
  priceToTradesTransposed: {
    [price: number]: {
      side: SideType;
      status: "order" | "position";
      type: OrderType;
    };
  };
};

const KrakenContext = createContext<KrakenDataContextType>({
  addOrder: noop,
  logMessages: [],
  cancelOrder: noop,
  cancelAllPendingOrders: noop,
  fetchOrders: noop,
  fetchTrades: noop,
  trades: [],
  orders: [],
  totalTradesCount: {
    total: 0,
    sells: 0,
    buys: 0,
  },
  priceToTradesTransposed: {},
  closeAllTrades: noop,
  flattenTrade: noop,
  closeTrade: noop,
  flattenAllTrades: noop,
  addLogMessage: noop,
});

export const useKrakenDataContext = () => useContext(KrakenContext);

type Props = {
  children: any;
};

export const KrakenDataProvider = ({ children }: Props) => {
  const [messages, setMessageHistory] = useState([]);
  const [priceToTradesTransposed, setPriceToTradesTransposed] = useState({});
  const [krakenWsUrl] = useState("wss://ws.kraken.com/");
  const { sendMessage, lastMessage, readyState } = useWebSocket(krakenWsUrl, {
    heartbeat: {
      message: "ping",
      returnMessage: "pong",
      timeout: 60000, // 1 minute, if no response is received, the connection will be closed
      interval: 25000, // every 25 seconds, a ping message will be sent
    },
    shouldReconnect: (closeEvent) => {
      /*
      useWebSocket will handle unmounting for you, but this is an example of a
      case in which you would not want it to automatically reconnect
    */
      return didUnmount.current === false;
    },
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    retryOnError: true,
  });
  const { lastMessage: orderBookLastMessage, readyState: orderBookReadyState } =
    useWebSocket(orderBookSocketUrl);

  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);

  const [totalTradesCount, setTotalTradesCount] = useState({
    total: 0,
    sells: 0,
    buys: 0,
  });

  const addLogMessage = (text: string, level: LogLevel = LogLevel.INFO) => {
    // @ts-ignore
    setMessageHistory((prev) => {
      if (prev) {
        if (prev.length > 0) {
          const latestMassage = prev[prev.length - 1];

          if (latestMassage.text === JSON.stringify(text)) {
            return prev;
          }
        }
        // @ts-ignore
        prev.push({
          text: JSON.stringify(text),
          level,
          time: moment().format(),
        });
      }
      return prev;
    });
  };

  const fetchOrders = useCallback(() => {
    fetch("http://localhost:8000/orders")
      .then((response) => response.json())
      .then((data) => {
        const res = [];
        const payload = JSON.parse(data);
        for (const [key, value] of Object.entries(payload)) {
          res.push({ id: key, value });
        }
        setOrders(res);
      })
      .catch((err) => {
        addLogMessage(err.message, LogLevel.ERROR);
      });
  }, []);

  const roundPrice = useCallback(
    (value: number) => {
      if (selectedBook?.price_decimals) {
        const precision = Math.pow(10, selectedBook?.price_decimals);

        if (precision) {
          return Math.round(value * precision) / precision;
        }
      }
      return value;
    },
    [selectedBook?.price_decimals]
  );

  const fetchTrades = useCallback(() => {
    fetch("http://localhost:8000/positions")
      .then((response) => response.json())
      .then((data) => {
        const updateData = data.map(
          (trade: TradeResponseType): TradeResponseExtendedType => ({
            ...trade,
            entryPrice: roundPrice(trade.cost / trade.vol),
          })
        );

        setTrades(updateData);

        const transposed = updateData.reduce((acc, trade) => {
          // @ts-ignore
          if (!acc) {
            acc = {};
          }
          if (trade) {
            acc = {
              ...acc,
              [trade.entryPrice]: trade,
            };
          }
          return acc;
        }, {});

        setPriceToTradesTransposed(transposed);

        const buys = data.filter(
          (x: TradeResponseType) => x.type === Side.buy
        ).length;
        const sells = data.filter(
          (x: TradeResponseType) => x.type === Side.sell
        ).length;
        setTotalTradesCount({
          total: data.length,
          sells,
          buys,
        });
      })
      .catch((err) => {
        addLogMessage(err.message, LogLevel.ERROR);
      });
  }, [roundPrice]);

  const __refetchOrdersAndTrades = () => {
    console.log("fetching Orders and trades");
    fetchTrades();
    fetchOrders();
  };

  const debouncedRefetchOrdersAndTrades = useCallback(
    debounce(__refetchOrdersAndTrades, 500),
    []
  );

  useEffect(() => {
    debouncedRefetchOrdersAndTrades();
  }, []);

  // const debounceSetBook = throttle((newBook) => {
  //   // console.log("setbook");
  //   setSelectedBook(newBook);
  // }, 100);

  useEffect(() => {
    if (orderManagementLastMessage !== null) {
      addLogMessage(orderManagementLastMessage.data);
      const obj = JSON.parse(orderManagementLastMessage.data);
      if (obj && (obj["txid"] || obj["count"])) {
        debouncedRefetchOrdersAndTrades();
      }
    }
  }, [orderManagementLastMessage]);

  useEffect(() => {
    if (ordersLastMessage !== null || tradesLastMessage !== null) {
      addLogMessage(
        ordersLastMessage !== null
          ? ordersLastMessage.data
          : tradesLastMessage?.data
      );

      debouncedRefetchOrdersAndTrades();
    }
  }, [ordersLastMessage, tradesLastMessage]);

  useEffect(() => {
    const __book = orderBookLastMessage?.data
      ? JSON.parse(JSON.parse(orderBookLastMessage?.data))
      : undefined;

    if (
      __book &&
      __book.pair === selectedPair &&
      __book.checksum !== selectedBook?.checksum
    ) {
      setSelectedBook(__book);
    }
  }, [orderBookLastMessage, selectedBook?.checksum, selectedPair]);
  useEffect(() => () => console.log("unmount"), []);

  const addOrder = useCallback(
    (ordertype: OrderType, side: SideType, price: number) => {
      if (selectedBook) {
        const pair = selectedBook.pair;
        const { sells, buys } = totalTradesCount;
        const oppositeOrder =
          (side === Side.buy && sells > 0) || (side === Side.sell && buys > 0);
        const reduceOnly = oppositeOrder ? scaleInOut : false;

        sendOrderManagementMessage(
          JSON.stringify({
            operation: "add_order",
            ordertype: ordertype.toString(),
            side,
            price,
            pair,
            volume: orderAmount,
            // @ts-ignore
            leverage: Leverage[pair],
            reduce_only: reduceOnly,
          })
        );
      }
    },
    [
      selectedBook,
      totalTradesCount,
      scaleInOut,
      sendOrderManagementMessage,
      orderAmount,
    ]
  );

  const cancelOrder = useCallback(
    (id: string) => {
      sendOrderManagementMessage(
        JSON.stringify({
          operation: "cancel_pending_order",
          id,
        })
      );
    },
    [sendOrderManagementMessage]
  );

  const closeTrade = useCallback(
    (trade: TradeResponseExtendedType) => {
      if (selectedBook) {
        const pair = selectedBook.pair;
        sendOrderManagementMessage(
          JSON.stringify({
            operation: "add_order",
            ordertype: Order.market,
            side: trade.type === Side.sell ? Side.buy : Side.sell,
            pair,
            volume: trade.vol,
            // @ts-ignore
            leverage: Leverage[pair],
            reduce_only: true,
          })
        );
      }
    },
    [selectedBook, sendOrderManagementMessage]
  );

  const flattenTrade = useCallback(
    (trade: TradeResponseExtendedType) => {
      if (selectedBook) {
        const pair = selectedBook.pair;
        sendOrderManagementMessage(
          JSON.stringify({
            operation: "add_order",
            ordertype: Order.limit,
            side: trade.type === Side.sell ? Side.buy : Side.sell,
            price:
              trade.type === Side.sell
                ? selectedBook.best_ask
                : selectedBook.best_bid,
            pair,
            volume: trade.vol,
            // @ts-ignore
            leverage: Leverage[pair],
            reduce_only: true,
          })
        );
      }
    },
    [selectedBook, sendOrderManagementMessage]
  );

  const closeAllTrades = useCallback(() => {
    trades.forEach((trade) => closeTrade(trade));
  }, [closeTrade, trades]);

  const flattenAllTrades = useCallback(() => {
    trades.forEach((trade) => flattenTrade(trade));
  }, [flattenTrade, trades]);

  const cancelAllPendingOrders = useCallback(() => {
    sendOrderManagementMessage(
      JSON.stringify({
        operation: "cancel_all_pending_orders",
      })
    );
  }, [sendOrderManagementMessage]);

  const ctx = {
    // fetchOrders,
    // fetchTrades,
    // status: st,
    // orders,
    trades,
    // cancelOrder,
    // cancelAllPendingOrders,
    // totalTradesCount,
    // priceToTradesTransposed,
    // closeTrade,
    // flattenTrade,
    // closeAllTrades,
    // flattenAllTrades,
    // addLogMessage,
  };

  return (
    <KrakenContext.Provider value={ctx}>{children}</KrakenContext.Provider>
  );
};
