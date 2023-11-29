"use client";

import { useState, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import WsStatusIcon from "./wsstatusicon";

export default function Orders() {
  // const [socketUrl, setSocketUrl] = useState("ws://localhost:8000/ws_orders");
  // const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  const [orders, setOrders] = useState([]);
  // useEffect(() => {
  //   // console.log(lastMessage?.data);
  //   const parsed = lastMessage?.data && JSON.parse(lastMessage.data);
  //   console.log("Parsed orders2:" + lastMessage?.data);
  //   console.log("Parsed orders:" + parsed);
  //   if (Array.isArray(parsed)) {
  //     setOrders(orders);
  //   }
  // }, [lastMessage, orders]);

  const fetchData = () => {
    fetch("http://localhost:8000/orders")
      .then((response) => response.json())
      .then((data) => {
        const res = [];
        const payload = JSON.parse(data);
        for (const [key, value] of Object.entries(payload)) {
          res.push({ id: key, value });
        }
        setOrders(res);
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex flex-col overflow-auto h-full bg-gray-200 border-2 rounded border-gray-400 p-2 m-1">
      <div>
        {orders &&
          orders.length > 0 &&
          orders.map((x, i) => <div key={i}>{x.id}</div>)}
      </div>
      {orders.length === 0 && (
        <div className="h-full grid items-center justify-items-center text-xs">
          <div>No orders</div>
        </div>
      )}
    </div>
  );
}
