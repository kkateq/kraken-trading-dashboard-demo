"use client";

import { useState, useCallback } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { OrderType, SideType } from "./commons";
import Book from "./bookview";
import WsStatusIcon from "./wsstatusicon";

export default function Orderbook() {
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
      leverage: number
    ) => {
      sendMessage(
        JSON.stringify({
          operation: "add_order",
          ordertype: ordertype.toString(),
          side,
          price,
          pair,
          volume,
          leverage,
        })
      );
    },
    [sendMessage]
  );
  return (
    <div className="flex p-2">
      <div>
        <WsStatusIcon readyState={orderBookReadyState} />
        <WsStatusIcon readyState={readyState} />
      </div>
      {orderBookLastMessage?.data && (
        <Book
          obj={JSON.parse(orderBookLastMessage?.data)}
          addOrder={addOrder}
        />
      )}
    </div>
  );
}
