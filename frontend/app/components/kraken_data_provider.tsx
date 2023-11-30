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
  setOrderAmount: (arg0: number) => void;
  status: {
    orderBookReadyState: ReadyState;
    orderManagementReadyState: ReadyState;
    ordersReadyState: ReadyState;
    tradesReadyState: ReadyState;
    allSystems: number;
  };
  logMessages: Message[];
  fetchOrders: () => void;
  fetchTrades: () => void;
  trades: TradeResponseType[];
  orders: OrderResponseType[];
};

const KrakenContext = createContext<KrakenDataContextType>({
  orderAmount: 10,
  scaleInOut: true,
  addOrder: noop,
  logMessages: [],
  setOrderAmount: noop,
  setScaleInOut: noop,
  book: undefined,
  status: {
    orderBookReadyState: ReadyState.UNINSTANTIATED,
    orderManagementReadyState: ReadyState.UNINSTANTIATED,
    ordersReadyState: ReadyState.UNINSTANTIATED,
    tradesReadyState: ReadyState.UNINSTANTIATED,
    allSystems: -1,
  },
  fetchOrders: noop,
  fetchTrades: noop,
  trades: [],
  orders: [],
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

  const [ordersWebSocketUrl] = useState("ws://localhost:8000/ws_orders");
  const { lastMessage: ordersLastMessage, readyState: ordersReadyState } =
    useWebSocket(ordersWebSocketUrl);

  const [tradesWebSocketUrl] = useState("ws://localhost:8000/ws_trades");
  const { lastMessage: tradesLastMessage, readyState: tradesReadyState } =
    useWebSocket(tradesWebSocketUrl);

  const [orderAmount, setOrderAmount] = useState<number>(10);
  const [scaleInOut, setScaleInOut] = useState<boolean>(true);
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);

  const [status, setStatus] = useState({
    orderBookReadyState: ReadyState.UNINSTANTIATED,
    orderManagementReadyState: ReadyState.UNINSTANTIATED,
    ordersReadyState: ReadyState.UNINSTANTIATED,
    tradesReadyState: ReadyState.UNINSTANTIATED,
    allSystems: -1,
  });

  const addLogMessage = (text: string, level: LogLevel = LogLevel.INFO) => {
    // @ts-ignore
    setMessageHistory((prev) => {
      if (prev) {
        prev.concat({
          // @ts-ignore
          text,
          level,
          time: moment().format(),
        });
      }
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
    if (ordersReadyState === ReadyState.OPEN) {
      fetchOrders();
      console.log("fetched orders");
    }
  }, [fetchOrders, ordersLastMessage, ordersReadyState]);

  useEffect(() => {
    if (tradesReadyState === ReadyState.OPEN) {
      fetchTrades();
      console.log("fetched trades");
    }
  }, [fetchTrades, tradesLastMessage, tradesReadyState]);

  useEffect(() => {
    setStatus((prev) => ({
      ...prev,
      orderBookReadyState,
      orderManagementReadyState,
      status: orderBookReadyState + orderManagementReadyState,
    }));
  }, [orderBookReadyState, orderManagementReadyState]);

  useEffect(() => {
    if (orderManagementLastMessage !== null) {
      addLogMessage(orderManagementLastMessage.data);
    }
  }, [orderManagementLastMessage]);

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

  const data = orderBookLastMessage?.data
    ? JSON.parse(JSON.parse(orderBookLastMessage?.data))
    : undefined;

  const systemsCount = 4;
  const st = {
    orderManagementReadyState,
    ordersReadyState,
    tradesReadyState,
    orderBookReadyState,
    allSystems: Math.round(
      (orderManagementReadyState +
        orderBookReadyState +
        tradesReadyState +
        ordersReadyState) /
        systemsCount
    ),
  };

  const ctx = {
    orderAmount,
    scaleInOut,
    addOrder,
    logMessages: messages,
    setOrderAmount,
    setScaleInOut,
    book: data,
    fetchOrders,
    fetchTrades,
    status: st,
    orders,
    trades,
  };

  console.log(st);
  return (
    <KrakenContext.Provider value={ctx}>{children}</KrakenContext.Provider>
  );
};
