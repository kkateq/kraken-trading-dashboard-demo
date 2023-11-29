"use client";

import { useCallback, useState } from "react";
import Orderbook from "./components/orderbook";

import { LogLevel } from "./components/commons";

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
        <Orderbook addMessage={addMessage} messages={messages} />
      </div>
    </main>
  );
}
