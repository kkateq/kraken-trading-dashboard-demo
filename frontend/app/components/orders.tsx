"use client";

import { useState, useEffect } from "react";
import moment from "moment";
import { IconButton, Tooltip } from "@material-tailwind/react";
import { useKrakenDataContext } from "./kraken_data_provider";

export default function Orders() {
  const { orders, cancelOrder } = useKrakenDataContext();

  const handleOrderCancel = (id: string) => cancelOrder(id);

  return (
    <div className="flex flex-col overflow-auto h-full bg-gray-200 border-2 rounded border-gray-400 p-2 ">
      <h5 className="text-xs text-gray-400 bold text-center mb-1">ORDERS</h5>
      <table className="w-full min-w-max table-auto text-left text-sm ">
        <thead className="">
          <tr>
            <th>Time</th>
            <th>Order</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders &&
            orders.length > 0 &&
            orders.map((entry, i) => {
              const {
                id,
                value: {
                  opentm,
                  descr: { order, type },
                },
              } = entry;
              const color =
                type === "sell" ? "text-pink-400" : "text-green-500";
              return (
                <tr key={i} className="text-xs">
                  <td>{moment.unix(opentm).format("MM/DD/YY HH:MM")}</td>
                  <td className={color}>{order}</td>
                  <td>
                    <Tooltip content="Cancel order">
                      <IconButton
                        size="sm"
                        variant="outlined"
                        onClick={handleOrderCancel(id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="h-full grid items-center justify-items-center text-xs">
          <div>No orders</div>
        </div>
      )}
    </div>
  );
}
