"use client";

import Book from "./bookview";
import WsStatusIcon from "./wsstatusicon";
import Orders from "./orders";
import Trades from "./trades";
import MessageLog from "./messagelog";
import { OrderForm } from "./orderform";
import { useKrakenDataContext } from "./kraken_data_provider";
import Chart from "./chart";
import { useEffect } from "react";

export default function Orderbook() {
  const {
    status: { allSystems },
  } = useKrakenDataContext();

  return (
    <div className="flex ml-1">
      <div
        className="flex flex-col gap-2"
        style={{ width: "500px", minWidth: "500px" }}
      >
        <div className="pt-2 flex">
          <WsStatusIcon readyState={allSystems} />
          Balance
        </div>
        <div>
          <OrderForm />
        </div>
        <div>
          <Orders />
        </div>
        <div>
          <Trades />
        </div>
        <div>
          <MessageLog />
        </div>
      </div>
      <div>
        <Book />
      </div>
      <div className="w-full h-screen">
        <Chart />
      </div>
    </div>
  );
}
