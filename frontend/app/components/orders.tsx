"use client";

import { useState, useEffect } from "react";

export default function Orders() {
  const [orders, setOrders] = useState([]);

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
    <div className="flex flex-col overflow-auto h-full bg-gray-200 border-2 rounded border-teal-200 p-2 ">
      <h5 className="text-xs text-gray-400 bold text-center mb-1">ORDERS</h5>
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
