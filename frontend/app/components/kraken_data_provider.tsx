"use client";

import {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  useCallback,
} from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import {
  LogLevel,
  OrderResponseType,
  TradeResponseType,
  Side,
  noop,
  SideType,
  OrderType,
} from "./commons";
import moment from "moment";
import { debounce } from "lodash";

type KrakenDataContextType = {
  trades: TradeResponseType[];
  orders: OrderResponseType[];
  priceToTradesTransposed: {
    [price: number]: {
      side: SideType;
      status: "order" | "position";
      type: OrderType;
    };
  };
  totalTradesCount: {
    total: number;
    sells: number;
    buys: number;
  };
  flattenTrade: (trade: TradeResponseType) => void;
  closeTrade: (trade: TradeResponseType) => void;
  cancelOrder: (id: string) => void;
  cancelAllPendingOrders: () => void;
  fetchOrders: () => void;
  fetchTrades: () => void;
  closeAllTrades: () => void;
  flattenAllTrades: () => void;
};

const KrakenContext = createContext<KrakenDataContextType>({
  trades: [],
  orders: [],
  totalTradesCount: {
    total: 0,
    sells: 0,
    buys: 0,
  },
  priceToTradesTransposed: {},
  cancelOrder: noop,
  cancelAllPendingOrders: noop,
  fetchOrders: noop,
  fetchTrades: noop,
  closeAllTrades: noop,
  flattenTrade: noop,
  closeTrade: noop,
  flattenAllTrades: noop,
});

export const useKrakenDataContext = () => useContext(KrakenContext);

type Props = {
  children: any;
};

export const KrakenDataProvider = ({ children }: Props) => {
  const didUnmount = useRef(false);
  const [token, setToken] = useState();
  const [messages, setMessageHistory] = useState([]);
  const [priceToTradesTransposed, setPriceToTradesTransposed] = useState({});
  const [krakenWsUrl] = useState("wss://ws-auth.kraken.com");
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

  useEffect(() => {
    fetch("http://localhost:8000/token")
      .then((response) => response.json())
      .then((data) => {
        if (data?.result?.token) {
          setToken(data?.result?.token);
          sendMessage(
            JSON.stringify({
              event: "subscribe",
              subscription: {
                name: "ownTrades",
                token: data?.result?.token,
              },
            })
          );
          sendMessage(
            JSON.stringify({
              event: "subscribe",
              subscription: {
                name: "openOrders",
                token: data?.result?.token,
              },
            })
          );
        } else if (data?.error && data?.error.length > 0) {
          addLogMessage(JSON.stringify(data?.error), LogLevel.ERROR);
        }
      })
      .catch((err) => {
        addLogMessage(err.message, LogLevel.ERROR);
      });
    return () => {
      didUnmount.current = true;
    };
  }, []);

  useEffect(() => {
    if (!lastMessage?.data) {
      return;
    }

    const parsedData = JSON.parse(lastMessage?.data);
    if (Array.isArray(parsedData)) {
      const [data, subscription, seq] = parsedData;
      if (subscription === "ownTrades") {
        fetchTrades();
      } else if (subscription === "openOrders") {
        fetchOrders();
      }
    } else {
      if (parsedData?.event === "subscriptionStatus") {
        addLogMessage(lastMessage.data);
      }
    }
  }, [lastMessage?.data]);

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

  const fetchTrades = useCallback(() => {
    fetch("http://localhost:8000/positions")
      .then((response) => response.json())
      .then((data) => {
        setTrades(data);

        const transposed = data.reduce((acc, trade) => {
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
  }, []);

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

  const ctx = {
    trades,
    orders,
    priceToTradesTransposed,
    totalTradesCount,
    fetchOrders,
    fetchTrades,
  };

  return (
    <KrakenContext.Provider value={ctx}>{children}</KrakenContext.Provider>
  );
};
