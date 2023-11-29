"use client";

import { useCallback, useState } from "react";
import Orderbook from "./components/orderbook";
import Orders from "./components/orders";
import Trades from "./components/trades";
import { LogLevel } from "./components/commons";
import MessageLog from "./components/messagelog";
import moment from "moment";
export default function Home() {
  const [messages, setMessageHistory] = useState([]);

  const addMessage = useCallback(
    (text: string, level: LogLevel) => {
      setMessageHistory((prev) =>
        // @ts-ignore
        prev.concat({ text, level, time: moment().format() })
      );
    },
    [setMessageHistory]
  );
  return (
    <main className="h-screen w-screen bg-gray-200">
      <div className="h-full overflow-hidden">
        <div className="overflow-hidden h-full">
          <div className="flex">
            <div style={{ minWidth: "400px" }} className="flex">
              <div className="grid grid-rows-4 gap-2 w-full">
                <div className="row-span-2">
                  <Trades />
                </div>
                <div className="row-span-2">
                  <Orders />
                </div>
                <div className="rows-span-1 m-1">
                  {/* @ts-ignore */}
                  <MessageLog messages={messages} />
                </div>
              </div>
            </div>
            <div className="w-full">
              <Orderbook addMessage={addMessage} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
