"use client";

import { useState, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import WsStatusIcon from "./wsstatusicon";

export default function Orders() {
  const [socketUrl, setSocketUrl] = useState("ws://localhost:8000/ws_orders");
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    const parsed = lastMessage?.data && JSON.parse(lastMessage.data);
    if (Array.isArray(parsed)) {
      setOrders(orders);
    }
  }, [lastMessage, orders]);

  return (
    <div className="flex flex-col overflow-auto h-full bg-gray-200 border-2 rounded border-gray-400 p-2 m-1">
      <div className="flex">
        <WsStatusIcon readyState={readyState} />
        <h4>Orders</h4>
      </div>
      <div>
        {orders &&
          orders.length > 0 &&
          orders.map((order, i) => <div key={i}>order</div>)}
      </div>
      {orders.length === 0 && (
        <div className="h-full grid items-center justify-items-center text-xs">
          <div>No orders</div>
        </div>
      )}
    </div>
  );
}
