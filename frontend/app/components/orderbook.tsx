"use client";

import { useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

import Book from "./bookview";
import WsStatusIcon from "./wsstatusicon";
export default function Orderbook() {
  const [socketUrl] = useState("ws://localhost:8000/ws_orderbook");
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

  return (
    <div className="flex p-2">
      <WsStatusIcon readyState={readyState} />
      {lastMessage?.data && <Book obj={JSON.parse(lastMessage.data)} />}
    </div>
  );
}
