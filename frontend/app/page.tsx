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
          <div className="flex h-full">
            <Orderbook addMessage={addMessage} />

            <div className="w-full flex flex-col space-y-2">
              <div className="bg-violet-300">
                <Trades />
              </div>
              <div className="bg-lime-200">
                <Orders />
              </div>
              <div className="">
                {/* @ts-ignore */}
                <MessageLog messages={messages} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
