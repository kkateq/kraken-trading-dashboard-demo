import Image from "next/image";
import Orderbook from "./components/orderbook";
import Orders from "./components/orders";
import Trades from "./components/trades";

export default function Home() {
  return (
    <main className="h-screen w-screen bg-gray-200">
      <div className="h-full overflow-hidden">
        <div className="overflow-hidden h-full">
          <div className="flex h-full">
            <Orderbook />

            <div className="w-full">
              <div className="bg-violet-300">
                <Trades />
              </div>
              <div className="bg-lime-200">
                <Orders />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
