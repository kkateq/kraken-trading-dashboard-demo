import Image from "next/image";
import Orderbook from "./components/orderbook";
export default function Home() {
  return (
    <main className="h-screen w-screen">
      <div className="bg-white h-full">
        <Orderbook />
      </div>
    </main>
  );
}
