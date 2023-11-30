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
  DefaultVolume,
  Message,
  noop,
  BookDataType,
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
    allSystems: ReadyState;
  };
  logMessages: Message[];
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
    allSystems: -1,
  },
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

  const [status, setStatus] = useState({
    orderBookReadyState: ReadyState.UNINSTANTIATED,
    orderManagementReadyState: ReadyState.UNINSTANTIATED,
    allSystems: -1,
  });

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
      // @ts-ignore
      setMessageHistory((prev) => {
        if (prev) {
          prev.concat({
            // @ts-ignore
            text: orderManagementLastMessage.data,
            level: LogLevel.INFO,
            time: moment().format(),
          });
        }
      });
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

  const ctx = {
    orderAmount,
    scaleInOut,
    addOrder,
    logMessages: messages,
    setOrderAmount,
    setScaleInOut,
    book: data,
    status,
  };

  return (
    <KrakenContext.Provider value={ctx}>{children}</KrakenContext.Provider>
  );
};
