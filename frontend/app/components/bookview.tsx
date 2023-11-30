"use client";

import { useEffect, useState } from "react";
import {
  Order,
  OrderType,
  Side,
  SideType,
  Leverage,
  BookPriceType,
  BookDataType,
  WATCH_PAIRS,
} from "./commons";
import { useKrakenDataContext } from "./kraken_data_provider";
import { Select, Option } from "@material-tailwind/react";

const Bookview = () => {
  const { book: __book, orderAmount, addOrder } = useKrakenDataContext();
  const [selectedPair, setSelectedPair] = useState(WATCH_PAIRS[0]);
  const [selectedBook, setSelectedBook] = useState<BookDataType | undefined>(
    undefined
  );

  useEffect(() => {
    if (__book && __book.pair === selectedPair) {
      setSelectedBook(__book);
    }
  }, [__book, selectedPair]);

  if (!selectedBook) {
    return null;
  }

  const {
    data,
    pair,
    depth,
    ask_volume_total,
    bid_volume_total,
    ask_volume_total_percentage,
    bids_volume_total_percentage,
  } = selectedBook;

  const bidColor = "sky";
  const askColor = "pink";

  const getOrderType = (
    side: SideType,
    index: number,
    depth: number
  ): string => {
    const pegLevel = depth;
    if (side == Side.buy.toString() && index < pegLevel) {
      return Order.stop;
    }
    if (side == Side.buy.toString() && index >= pegLevel) {
      return Order.limit;
    }
    if (side == Side.sell.toString() && index < pegLevel) {
      return Order.limit;
    }
    if (side == Side.sell.toString() && index >= pegLevel) {
      return Order.stop;
    }
    return Order.market;
  };

  const handleBuyStop = (index: number, price: number) => {};
  const handleSellStop = (index: number, price: number) => {};

  const handleBidClick = (index: number, price: number) => {
    const orderType = getOrderType(Side.buy, index, depth);

    // @ts-ignore
    const leverage = Leverage[pair];
    const reduceOnly = orderType === Order.stop;
    if (!reduceOnly) {
      addOrder(
        orderType as OrderType,
        Side.buy,
        price,
        pair,
        orderAmount,
        leverage,
        reduceOnly
      );
    }
  };

  const handleAskClick = (index: number, price: number) => {
    const orderType = getOrderType(Side.sell, index, depth);

    // @ts-ignore
    const leverage = Leverage[pair];
    const reduceOnly = orderType === Order.stop;
    addOrder(
      orderType as OrderType,
      Side.sell,
      price,
      pair,
      orderAmount,
      leverage,
      reduceOnly
    );
  };

  const handleBuyMarketClick = (price: number) => {
    const orderType = Order.market;
    console.log("buy" + "|" + orderType + "|" + price);
  };
  const handleSellMarketClick = (price: number) => {
    const orderType = Order.market;
    console.log("sell" + "|" + orderType + "|" + price);
  };

  const handlePairChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPair(e.target.value as any);
  };

  return (
    <div className="flex rounded text-sm" style={{ height: "95vh" }}>
      <div className="ml-2" style={{ width: "400px" }}>
        <div className="space-x-1 mt-1 flex">
          <div className="bold mr-4">
            <div className="w-72">
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
                  <div
                    className={
                      i < depth
                        ? "flex-1 pr-2 text-right text-sky-800 cursor-pointer hover:bg-cyan-100"
                        : "flex-1 pr-2 text-right text-sky-800 cursor-pointer hover:bg-sky-100"
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
                        : "flex-1 pl-2 text-left text-pink-800 cursor-pointer hover:bg-orange-100"
                    }
                    onClick={() => handleAskClick(i, x.price)}
                  >
                    {x.ask}
                  </div>
                </div>
                {i === depth - 1 ? (
                  <div className="border-1 flex space-x-2">
                    <div
                      className="p-3 flex-1 pr-2 text-right text-sky-800 cursor-pointer hover:bg-sky-600"
                      onClick={() => handleBuyMarketClick(x.price)}
                    ></div>
                    <div className="flex-1 text-center text-gray-500"></div>
                    <div
                      className="p-3 flex-1 pl-2 text-left text-pink-800 cursor-pointer hover:bg-pink-600"
                      onClick={() => handleSellMarketClick(x.price)}
                    ></div>
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
