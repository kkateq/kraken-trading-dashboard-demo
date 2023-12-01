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

type KrakenDataContextType = {
  book: BookDataType | undefined;
  orderAmount: number;
  scaleInOut: boolean;
  setScaleInOut: (arg1: boolean) => void;
  addOrder: (ordertype: OrderType, side: SideType, price: number) => void;
  cancelOrder: (id: string) => void;
  cancelAllPendingOrders: () => void;
  setOrderAmount: (arg0: number) => void;
  status: {
    orderBookReadyState: ReadyState;
    orderManagementReadyState: ReadyState;

    allSystems: number;
  };
  logMessages: Message[];
  fetchOrders: () => void;
  fetchTrades: () => void;
  trades: TradeResponseExtendedType[];
  orders: OrderResponseType[];
  setSelectedPair: (p: string) => void;
  selectedPair: string;
  totalTradesCount: {
    total: number;
    sells: number;
    buys: number;
  };
  roundPrice: (price: number) => number;
  priceToTradesTransposed: {
    [price: number]: {
      side: SideType;
      status: "order" | "position";
      type: OrderType;
    };
  };
};

const KrakenContext = createContext<KrakenDataContextType>({
  orderAmount: 10,
  scaleInOut: true,
  addOrder: noop,
  logMessages: [],
  setOrderAmount: noop,
  setScaleInOut: noop,
  book: undefined,
  cancelOrder: noop,
  cancelAllPendingOrders: noop,
  status: {
    orderBookReadyState: ReadyState.UNINSTANTIATED,
    orderManagementReadyState: ReadyState.UNINSTANTIATED,
    allSystems: -1,
  },
  fetchOrders: noop,
  fetchTrades: noop,
  trades: [],
  orders: [],
  setSelectedPair: noop,
  selectedPair: WATCH_PAIRS[0],
  roundPrice: (price: number) => price,
  totalTradesCount: {
    total: 0,
    sells: 0,
    buys: 0,
  },
  priceToTradesTransposed: {},
});

export const useKrakenDataContext = () => useContext(KrakenContext);

type Props = {
  children: any;
};

export const KrakenDataProvider = ({ children }: Props) => {
  const [messages, setMessageHistory] = useState([]);
  const [priceToTradesTransposed, setPriceToTradesTransposed] = useState({});
  const [orderBookSocketUrl] = useState("ws://localhost:8000/ws_orderbook");
  const { lastMessage: orderBookLastMessage, readyState: orderBookReadyState } =
    useWebSocket(orderBookSocketUrl);

  const [orderManagementSocketUrl] = useState("ws://localhost:8000/ws_create");
  const {
    sendMessage: sendOrderManagementMessage,
    lastMessage: orderManagementLastMessage,
    readyState: orderManagementReadyState,
  } = useWebSocket(orderManagementSocketUrl);

  const [orderAmount, setOrderAmount] = useState<number>(10);
  const [scaleInOut, setScaleInOut] = useState<boolean>(true);
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [selectedPair, setSelectedPair] = useState(WATCH_PAIRS[0]);
  const [selectedBook, setSelectedBook] = useState<BookDataType | undefined>(
    undefined
  );
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

        // debugger;
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

  const refetchOrdersAndTrades = useCallback(() => {
    console.log("fetching data");
    fetchTrades();
    fetchOrders();
  }, [fetchOrders, fetchTrades]);

  useEffect(() => {
    refetchOrdersAndTrades();
  }, []);

  useEffect(() => {
    if (orderManagementLastMessage !== null) {
      addLogMessage(orderManagementLastMessage.data);
      debugger;
      if (orderManagementLastMessage.data["count"] === "1") {
        refetchOrdersAndTrades();
      }
    }
  }, [orderManagementLastMessage, refetchOrdersAndTrades]);

  useEffect(() => {
    const __book = orderBookLastMessage?.data
      ? JSON.parse(JSON.parse(orderBookLastMessage?.data))
      : undefined;

    if (
      __book &&
      __book.pair === selectedPair &&
      __book.checksum !== selectedBook?.checksum
    ) {
      setSelectedBook((p) => __book);
    }
  }, [orderBookLastMessage, selectedBook?.checksum, selectedPair]);

  const addOrder = useCallback(
    (ordertype: OrderType, side: SideType, price: number) => {
      if (selectedBook) {
        const pair = selectedBook.pair;
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
            reduce_only: scaleInOut,
          })
        );
      }
    },
    [selectedBook, sendOrderManagementMessage, orderAmount, scaleInOut]
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

  const cancelAllPendingOrders = useCallback(() => {
    sendOrderManagementMessage(
      JSON.stringify({
        operation: "cancel_all_pending_orders",
      })
    );
  }, [sendOrderManagementMessage]);

  const systemsCount = 2;
  const st = {
    orderManagementReadyState,

    orderBookReadyState,
    allSystems: Math.round(
      (orderManagementReadyState + orderBookReadyState) / systemsCount
    ),
  };

  const ctx = {
    orderAmount,
    scaleInOut,
    addOrder,
    logMessages: messages,
    setOrderAmount,
    setScaleInOut,
    book: selectedBook,
    fetchOrders,
    fetchTrades,
    status: st,
    orders,
    trades,
    cancelOrder,
    setSelectedPair,
    selectedPair,
    cancelAllPendingOrders,
    totalTradesCount,
    roundPrice,
    priceToTradesTransposed,
  };

  return (
    <KrakenContext.Provider value={ctx}>{children}</KrakenContext.Provider>
  );
};
