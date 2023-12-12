"use client";

import Krakenbook from "./krakenbook";

export default function Dashboard() {
  return (
    <div className="flex">
      <div className="w-full">
        <div className="flex border-solid border-2 rounded border-gray-400">
          {/* <select
            id="selectPair"
            onChange={handlePairChange}
            value={selectedPair}
          >
            {WATCH_PAIRS.map((v, i) => (
              <option value={v} key={i}>
                {v}
              </option>
            ))}
          </select> */}
        </div>
        <Krakenbook depth={10} pair="MATIC/USD" />
      </div>
    </div>
  );
}
