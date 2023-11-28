import Image from "next/image";
import Orderbook from "./components/orderbook";
import Orders from "./components/orders";
import Trades from "./components/trades";

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <div className="bg-white h-full">
        <div className="overflow-hidden h-full">
          <div className="flex h-full">
            <div className="w-80">
              <div className="bg-red-100">Order form</div>
              <div className="bg-violet-300">
                <Trades />
              </div>
              <div className="bg-lime-200">
                <Orders />
              </div>
            </div>
            <div className="w-full">{/* <Orderbook /> */}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
