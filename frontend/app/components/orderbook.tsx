"use client";

import Book from "./bookview";
import WsStatusIcon from "./wsstatusicon";
import Orders from "./orders";
import Trades from "./trades";
import MessageLog from "./messagelog";
import { OrderForm } from "./orderform";
import { useKrakenDataContext } from "./kraken_data_provider";
import Chart from "./chart";

export default function Orderbook() {
  const {
    status: { allSystems },
  } = useKrakenDataContext();

  return (
    <div className="flex">
      <div style={{ width: "600px", minWidth: "600px" }}>
        <Chart />
      </div>
      <div className="w-full">
        <Book />
      </div>
      <div
        className="flex flex-col gap-2"
        style={{ width: "400px", minWidth: "400px" }}
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
        <div className="items-end">
          <MessageLog />
        </div>
      </div>
    </div>
  );
}
