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
  TradeResponseType,
  OrderResponseType,
  WATCH_PAIRS,
} from "./commons";

type KrakenDataContextType = {
  book: BookDataType | undefined;
  orderAmount: number;
  scaleInOut: boolean;
  setScaleInOut: (arg1: boolean) => void;
  addOrder: (
    ordertype: OrderType,
    side: SideType,
    price: number,
    pair: string,
    volume: number,
    leverage: any,
    reduce_only: boolean
  ) => void;
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
  trades: TradeResponseType[];
  orders: OrderResponseType[];
  setSelectedPair: (p: string) => void;
  selectedPair: string;
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
});

export const useKrakenDataContext = () => useContext(KrakenContext);

type Props = {
  children: any;
};

export const KrakenDataProvider = ({ children }: Props) => {
  const [messages, setMessageHistory] = useState([]);
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

  const fetchTrades = useCallback(() => {
    fetch("http://localhost:8000/positions")
      .then((response) => response.json())
      .then((data) => {
        setTrades(data);
      })
      .catch((err) => {
        addLogMessage(err.message, LogLevel.ERROR);
      });
  }, []);

  useEffect(() => {
    if (
      orderManagementReadyState === ReadyState.OPEN &&
      orderBookReadyState === ReadyState.OPEN
    ) {
      fetchTrades();
      fetchOrders();
    }
  }, [
    orderManagementReadyState,
    orderBookReadyState,
    fetchTrades,
    fetchOrders,
  ]);

  useEffect(() => {
    if (orderManagementLastMessage !== null) {
      addLogMessage(orderManagementLastMessage.data);
      fetchTrades();
      fetchOrders();
    }
  }, [fetchOrders, fetchTrades, orderManagementLastMessage]);

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

  const addOrder = useCallback(
    (
      ordertype: OrderType,
      side: SideType,
      price: number,
      pair: string,
      volume: number,
      leverage: number,
      reduce_only: boolean
    ) => {
      sendOrderManagementMessage(
        JSON.stringify({
          operation: "add_order",
          ordertype: ordertype.toString(),
          side,
          price,
          pair,
          volume,
          leverage,
          reduce_only,
        })
      );
    },
    [sendOrderManagementMessage]
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
  };

  return (
    <KrakenContext.Provider value={ctx}>{children}</KrakenContext.Provider>
  );
};
