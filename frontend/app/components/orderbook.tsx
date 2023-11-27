"use client";

import { useState, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

import Book from "./bookview";

export default function Orderbook() {
  // const [messageHistory, setMessageHistory] = useState([]);
  const [socketUrl, setSocketUrl] = useState(
    "ws://localhost:8000/ws_orderbook"
  );
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  const statusColor = {
    [ReadyState.CONNECTING]: "text-teal-300",
    [ReadyState.OPEN]: "text-green-600",
    [ReadyState.CLOSING]: "text-yellow-400",
    [ReadyState.CLOSED]: "text-orange-600",
    [ReadyState.UNINSTANTIATED]: "text-indigo-700",
  }[readyState];

  return (
    <div className="overflow-hidden h-full">
      <div className="bg-gray-100 p-2">
        <span className="text-slate-500 text-sm">
          The WebSocket is currently{" "}
          <span className={statusColor}>{connectionStatus}</span>
        </span>
      </div>
      <div className="flex h-full">
        <div className="w-80">
          <div className="bg-red-100">Order form</div>
          <div className="bg-violet-300">Chart</div>
          <div className="bg-lime-200">Orders</div>
        </div>
        <div className="w-full">
          {lastMessage?.data && <Book obj={JSON.parse(lastMessage.data)} />}
        </div>
      </div>
    </div>
  );
}
