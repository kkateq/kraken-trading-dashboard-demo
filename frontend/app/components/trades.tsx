"use client";

import { useState, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import WsStatusIcon from "./wsstatusicon";

export default function Trades() {
  const [socketUrl, setSocketUrl] = useState("ws://localhost:8000/ws_trades");
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

  return (
    <div className="flex">
      <WsStatusIcon readyState={readyState} />
      <h4>Trades</h4>
      {lastMessage?.data && JSON.parse(lastMessage.data)}
    </div>
  );
}
