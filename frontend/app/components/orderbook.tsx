"use client";

import { useState, useCallback, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { OrderType, SideType, LogLevel, DefaultVolume } from "./commons";
import Book from "./bookview";
import WsStatusIcon from "./wsstatusicon";
import Orders from "./orders";
import Trades from "./trades";
import MessageLog from "./messagelog";
import { Message } from "postcss";
import { OrderForm } from "./orderform";

type Props = {
  addMessage?: (text: string, level: LogLevel) => void;
  messages: [Message];
};

export default function Orderbook({ addMessage, messages }: Props) {
  const [orderBookSocketUrl] = useState("ws://localhost:8000/ws_orderbook");
  const { lastMessage: orderBookLastMessage, readyState: orderBookReadyState } =
    useWebSocket(orderBookSocketUrl);

  const [socketUrl] = useState("ws://localhost:8000/ws_create");
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  const [orderAmount, setOrderAmount] = useState<number>(0);
  const [scaleInOut, setScaleInOut] = useState<boolean>(true);
  const [done, setDone] = useState(false);

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
      console.log("Sending add order message");
      sendMessage(
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
    [sendMessage]
  );

  const data = orderBookLastMessage?.data
    ? JSON.parse(JSON.parse(orderBookLastMessage?.data))
    : {};

  useEffect(() => {
    if (lastMessage !== null && addMessage) {
      addMessage(lastMessage.data, LogLevel.INFO);
    }
  }, [lastMessage, addMessage]);

  useEffect(() => {
    if (data?.pair && !done) {
      // @ts-ignore
      setOrderAmount(DefaultVolume[data.pair]);
      setDone(true);
    }
  }, [data.pair, done, orderBookLastMessage]);

  const handleChangeOrderAmount = (newAmount: number) => {
    setOrderAmount(newAmount);
  };

  const handleScaleInOut = (newValue: boolean) => {
    setScaleInOut(newValue);
  };

  return (
    <div className="flex ml-1">
      <div className="flex flex-col gap-2" style={{ minWidth: "500px" }}>
        <div>Balance</div>
        <div>
          <OrderForm
            orderAmount={orderAmount}
            onChangeOrderAmount={handleChangeOrderAmount}
            scaleInOut={scaleInOut}
            onChangeScaleInOut={handleScaleInOut}
            pegPrice={data?.peg_price}
          />
        </div>
        <div>
          <Orders />
        </div>
        <div>
          <Trades pegValue={data?.peg_price} />
        </div>
        <div>
          {/* @ts-ignore */}
          <MessageLog messages={messages} />
          <div className="p-2 flex">
            <WsStatusIcon readyState={orderBookReadyState} />
            <WsStatusIcon readyState={readyState} />
          </div>
        </div>
      </div>

      <div className="w-full">
        {orderBookLastMessage?.data && (
          <Book book={data} addOrder={addOrder} orderAmount={orderAmount} />
        )}
      </div>
    </div>
  );
}
