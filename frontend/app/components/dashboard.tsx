"use client";
import Krakenbook from "./krakenbook";
import { KrakenDataProvider } from "./kraken_data_provider";
import Trades from "./trades";
import Orders from "./orders";
import MessageLog from "./messagelog";

export default function Dashboard() {
  return (
    <KrakenDataProvider>
      <div className="flex">
        <div className="flex-1">
          <Krakenbook depth={25} pair={"MATIC/USD"} />
        </div>
        <div className="flex-1">
          <div className="grid">
            <Trades />
            <Orders />
            <MessageLog />
          </div>
        </div>
      </div>
    </KrakenDataProvider>
  );
}
