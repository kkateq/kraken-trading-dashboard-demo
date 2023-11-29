"use client";

import { useState, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import WsStatusIcon from "./wsstatusicon";

export default function Trades() {
  const [socketUrl, setSocketUrl] = useState("ws://localhost:8000/ws_trades");
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const parsed = lastMessage?.data && JSON.parse(lastMessage.data);
    if (Array.isArray(parsed)) {
      setTrades(trades);
    }
  }, [lastMessage, trades]);

  return (
    <div className="flex flex-col overflow-auto h-full bg-gray-200 border-2 rounded border-gray-400 p-2 m-1">
      <div className="flex">
        <WsStatusIcon readyState={readyState} />
        <h4>Trades</h4>
      </div>
      <div>
        {trades &&
          trades.length > 0 &&
          trades.map((trade, i) => <div key={i}>trade</div>)}
      </div>
      {trades.length === 0 && (
        <div className="h-full grid items-center justify-items-center text-xs">
          <div>No trades</div>
        </div>
      )}
    </div>
  );
}
