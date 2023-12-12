"use client";
import Krakenbook from "./krakenbook";

export default function Dashboard() {
  return (
    <div className="flex">
      <div className="w-full">
        <Krakenbook depth={25} pair={"MATIC/USD"} />
      </div>
    </div>
  );
}
