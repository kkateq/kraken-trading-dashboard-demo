"use client";

import { useState, useCallback, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { OrderType, SideType, LogLevel } from "./commons";
import Book from "./bookview";
import WsStatusIcon from "./wsstatusicon";

type Props = {
  addMessage?: (text: string, level: LogLevel) => void;
};

export default function Orderbook({ addMessage }: Props) {
  const [orderBookSocketUrl] = useState("ws://localhost:8000/ws_orderbook");
  const { lastMessage: orderBookLastMessage, readyState: orderBookReadyState } =
    useWebSocket(orderBookSocketUrl);

  const [socketUrl] = useState("ws://localhost:8000/ws_create");
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

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

  useEffect(() => {
    if (lastMessage !== null && addMessage) {
      addMessage(lastMessage.data, LogLevel.INFO);
    }
  }, [lastMessage, addMessage]);

  return (
    <div className="flex">
      {orderBookLastMessage?.data && (
        <Book
          obj={JSON.parse(orderBookLastMessage?.data)}
          addOrder={addOrder}
        />
      )}
      <div>
        <WsStatusIcon readyState={orderBookReadyState} />
        <WsStatusIcon readyState={readyState} />
      </div>
    </div>
  );
}
