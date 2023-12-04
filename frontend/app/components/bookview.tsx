"use client";

import {
  Order,
  OrderType,
  Side,
  SideType,
  BookPriceType,
  WATCH_PAIRS,
} from "./commons";
import { useKrakenDataContext } from "./kraken_data_provider";

const Bookview = () => {
  const {
    book,
    addOrder,
    selectedPair,
    setSelectedPair,
    priceToTradesTransposed,
  } = useKrakenDataContext();

  if (!book) {
    return null;
  }

  const {
    data,
    depth,
    ask_volume_total,
    bid_volume_total,
    ask_volume_total_percentage,
    bids_volume_total_percentage,
  } = book;

  const bidColor = "blue";
  const askColor = "pink";

  const getOrderType = (
    side: SideType,
    index: number,
    depth: number
  ): string | undefined => {
    const pegLevel = depth - 1;
    const aboveMid = index <= pegLevel;
    const belowMid = index > pegLevel;

    if (side === Side.buy) {
      if (belowMid) {
        return Order.limit;
      }
    }
    if (side === Side.sell) {
      if (aboveMid) {
        return Order.limit;
      }
    }

    return undefined;
  };

  const handleBidClick = (index: number, price: number) => {
    const check = priceToTradesTransposed[price];
    if (check) {
      console.log("trade exists");
      return;
    }
    const orderType = getOrderType(Side.buy, index, depth);
    if (orderType) {
      console.log("OrderType: " + Side.buy + " - " + orderType);

      addOrder(orderType as OrderType, Side.buy, price);
    }
  };

  const handleAskClick = (index: number, price: number) => {
    const check = priceToTradesTransposed[price];
    if (check) {
      console.log("trade exists");
      return;
    }
    const orderType = getOrderType(Side.sell, index, depth);
    if (orderType) {
      console.log("OrderType: " + Side.sell + " - " + orderType);

      addOrder(orderType as OrderType, Side.sell, price);
    }
  };

  const handleBuyMarketClick = (price: number) => {
    console.log("market");
    addOrder(Order.market, Side.buy, price);
  };
  const handleSellMarketClick = (price: number) => {
    console.log("market");
    addOrder(Order.market, Side.sell, price);
  };

  const handlePairChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPair(e.target.value as any);
  };

  const renderSellPosition = (price: number) => {
    const pos = priceToTradesTransposed[price];
    if (pos) {
      return pos.type === "sell" ? (
        <div className="flex pl-2 text-red-400 border-2 border-solid border-red-200 text-xs">
          <div>SL|{Math.round(pos.vol)}</div>
        </div>
      ) : null;
    }
    return <span></span>;
  };

  const renderBuyPosition = (price: number) => {
    const pos = priceToTradesTransposed[price];
    if (pos) {
      return pos.type === "buy" ? (
        <div className="flex pr-2 bg-blue-200"> BL|{Math.round(pos.vol)}</div>
      ) : null;
    }
    return <span></span>;
  };

  return (
    <div className="flex rounded text-sm" style={{ height: "95vh" }}>
      <div className="ml-2" style={{ width: "500px" }}>
        <div className="space-x-1 mt-1 flex">
          <div className="bold mr-4">
            <div className="flex border-solid border-2 rounded border-gray-400">
              <select
                id="selectPair"
                onChange={handlePairChange}
                value={selectedPair}
              >
                {WATCH_PAIRS.map((v, i) => (
                  <option value={v} key={i}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <span className={`w-full text-${bidColor}-800`}>
            {bid_volume_total}({bids_volume_total_percentage}%)
          </span>
          <span className={`w-full  text-${askColor}-800`}>
            {ask_volume_total}({ask_volume_total_percentage})%
          </span>
        </div>
        <div className="bg-white overflow-hidden flex flex-col h-full border-solid border-2 rounded border-gray-400 p-1">
          <div className="overflow-auto divide-y">
            {data.map((x: BookPriceType, i) => (
              <div key={i} className="divide-y">
                <div className="border-1 flex space-x-2 divide-x">
                  <div className="flex-1">{renderBuyPosition(x.price)}</div>
                  <div
                    className={
                      i < depth
                        ? "flex-1 pr-2 text-right text-blue-800"
                        : "flex-1 pr-2 text-right text-blue-800 cursor-pointer hover:bg-blue-100"
                    }
                    onClick={() => handleBidClick(i, x.price)}
                  >
                    {x.bid}
                  </div>
                  <div className="flex-1 text-center text-gray-500">
                    {x.price}
                  </div>
                  <div
                    className={
                      i < depth
                        ? "flex-1 pl-2 text-left text-pink-800 cursor-pointer hover:bg-pink-100"
                        : "flex-1 pl-2 text-left text-pink-800"
                    }
                    onClick={() => handleAskClick(i, x.price)}
                  >
                    {x.ask}
                  </div>
                  <div className="flex-1">{renderSellPosition(x.price)}</div>
                </div>
                {i === depth - 1 ? (
                  <div className="border-1 flex space-x-2">
                    <div className="flex-1"></div>
                    <div
                      className="p-2 flex-1 pr-2 text-right text-blue-800 cursor-pointer hover:bg-blue-600"
                      onClick={() => handleBuyMarketClick(x.price)}
                    ></div>
                    <div className="flex-1 text-center text-gray-500"></div>
                    <div
                      className="p-2 flex-1 pl-2 text-left text-pink-800 cursor-pointer hover:bg-pink-600"
                      onClick={() => handleSellMarketClick(x.price)}
                    ></div>
                    <div className="flex-1"></div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 text-xs">
          <h2 className="text-gray-600 mb-1">Order book depth {depth}</h2>
        </div>
      </div>
    </div>
  );
};

export default Bookview;
