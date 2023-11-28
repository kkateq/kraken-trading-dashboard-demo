"use client";

import { useEffect, useRef, useState } from "react";
import { Order, OrderType, Side, SideType } from "./commons";
import { OrderForm } from "./orderform";

type Price = {
  price: number;
  bid: number;
  ask: number;
};
type Data = {
  depth: number;
  data: [Price];
  ask_volume_total: number;
  bid_volume_total: number;
  ask_volume_total_percentage: number;
  bids_volume_total_percentage: number;
};
type Props = {
  obj: string;
};

const Bookview = ({ obj }: Props) => {
  const [scrolled, setScrolled] = useState(false);
  const pegElement = useRef<HTMLHRElement>(null);
  const [orderAmount, setOrderAmount] = useState<number>(0);
  const [scaleInOut, setScaleInOut] = useState<boolean>(true);

  useEffect(() => {
    if (pegElement?.current && !scrolled) {
      pegElement?.current.scrollIntoView();
      setScrolled(true);
    }
  }, [pegElement, scrolled]);

  if (!obj) {
    return null;
  }
  const {
    data,
    depth,
    ask_volume_total,
    bid_volume_total,
    ask_volume_total_percentage,
    bids_volume_total_percentage,
  }: Data = JSON.parse(obj);

  const bidColor = "sky";
  const askColor = "pink";

  const handleCreateOrder = (orderType: OrderType, price: number) => {
    console.log();
  };

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

  const handleBidClick = (index: number, price: number) => {
    const orderType = getOrderType(Side.buy, index, depth);
    console.log("buy" + "|" + orderType + "|" + price);
  };
  const handleAskClick = (index: number, price: number) => {
    const orderType = getOrderType(Side.sell, index, depth);
    console.log("sell" + "|" + orderType + "|" + price);
  };

  const handleBuyMarketClick = (price: number) => {
    const orderType = Order.market;
    console.log("buy" + "|" + orderType + "|" + price);
  };
  const handleSellMarketClick = (price: number) => {
    const orderType = Order.market;
    console.log("sell" + "|" + orderType + "|" + price);
  };

  const handleChangeOrderAmount = (newAmount: number) => {
    setOrderAmount(newAmount);
  };

  const handleScaleInOut = (newValue: boolean) => {
    setScaleInOut(newValue);
  };

  return (
    <div className="flex" style={{ height: "90vh" }}>
      <div className="" style={{ width: "350px" }}>
        <div className="space-x-2 mt-1 mb-3 flex">
          <span className={`text-${bidColor}-800`}>
            {bid_volume_total}({bids_volume_total_percentage}%)
          </span>
          <div className="w-full" />
          <span className={`text-${askColor}-800`}>
            {ask_volume_total}({ask_volume_total_percentage})%
          </span>
        </div>
        <div className=" overflow-hidden flex flex-col h-full border-solid border-2 border-gray-300 p-1">
          <div className="overflow-auto">
            {data.map((x: Price, i) => (
              <div key={i} className="">
                <div className="border-1 flex space-x-4 ">
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
                  <div className="border-1 flex space-x-4 ">
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

        <div className="mt-2">
          <h2 className="text-gray-600">Order book depth {depth}</h2>
        </div>
      </div>
      <div>
        <OrderForm
          orderAmount={orderAmount}
          onChangeOrderAmount={handleChangeOrderAmount}
          scaleInOut={scaleInOut}
          onChangeScaleInOut={handleScaleInOut}
        />
      </div>
    </div>
  );
};

export default Bookview;
