"use client";

import { useState, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import WsStatusIcon from "./wsstatusicon";

export default function Orders() {
  const [socketUrl, setSocketUrl] = useState("ws://localhost:8000/ws_orders");
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

  return (
    <div className="flex">
      <WsStatusIcon readyState={readyState} />
      {lastMessage?.data && JSON.parse(lastMessage.data)}
    </div>
  );
}
