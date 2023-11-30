"use client";

import Orderbook from "./components/orderbook";

import { KrakenDataProvider } from "./components/kraken_data_provider";

export default function Home() {
  return (
    <main className="h-screen w-screen bg-gray-200">
      <div className="h-full overflow-hidden">
        <KrakenDataProvider>
          <Orderbook />
        </KrakenDataProvider>
      </div>
    </main>
  );
}
