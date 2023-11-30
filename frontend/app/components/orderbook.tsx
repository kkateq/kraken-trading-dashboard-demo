"use client";

import { useState, useCallback, useEffect, useContext } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { OrderType, SideType, LogLevel, DefaultVolume } from "./commons";
import Book from "./bookview";
import WsStatusIcon from "./wsstatusicon";
import Orders from "./orders";
import Trades from "./trades";
import MessageLog from "./messagelog";
import { Message } from "postcss";
import { OrderForm } from "./orderform";
import { useKrakenDataContext } from "./kraken_data_provider";

type Props = {
  addMessage?: (text: string, level: LogLevel) => void;
  messages: [Message];
};

export default function Orderbook({ addMessage, messages }: Props) {
  const {
    status: { allSystems },
  } = useKrakenDataContext();

  return (
    <div className="flex ml-1">
      <div className="flex flex-col gap-2" style={{ minWidth: "500px" }}>
        <div>Balance</div>
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
          {/* @ts-ignore */}
          <MessageLog messages={messages} />
          <div className="p-2 flex">
            <WsStatusIcon readyState={allSystems} />
          </div>
        </div>
      </div>

      <div className="w-full">
        <Book />
      </div>
    </div>
  );
}
