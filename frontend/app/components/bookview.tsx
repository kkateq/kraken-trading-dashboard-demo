"use client";
import { useState, useEffect } from "react";
import {
  Order,
  Side,
  SideType,
  BookPriceType,
  BookDataType,
  PriceDecimals,
} from "./commons";
import { Slider } from "@material-tailwind/react";
import { roundPrice } from "./utils";

type Props = {
  book: BookDataType | undefined;
  addOrder: () => void;
};

const Bookview = ({ book }: Props) => {
  const [orderAmount, setOrderAmount] = useState<number>(10);
  const [scaleInOut, setScaleInOut] = useState<boolean>(true);
  const { data, depth, pair, peg_price } = book || {};

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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderAmount(e.target.value as any);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderAmount(e.target.value as any);
  };

  const handleScaleInOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScaleInOut(!scaleInOut);
  };

  const handleBidClick = (index: number, price: number) => {
    // const check = priceToTradesTransposed[price];
    // if (check) {
    //   console.log("trade for this price level already exists");
    //   return;
    // }
    // const orderType = getOrderType(Side.buy, index, depth);
    // if (orderType) {
    //   console.log("OrderType: " + Side.buy + " - " + orderType);
    //   setTemporaryOrders((prev) => ({
    //     ...prev,
    //     [price]: {
    //       side: Side.buy,
    //       type: orderType,
    //       vol: orderAmount,
    //     },
    //   }));
    //   addOrder(orderType as OrderType, Side.buy, price);
    // }
  };

  const handleAskClick = (index: number, price: number) => {
    // const check = priceToTradesTransposed[price];
    // if (check) {
    //   console.log("trade for this price level already exists");
    //   return;
    // }
    // const orderType = getOrderType(Side.sell, index, depth);
    // if (orderType) {
    //   console.log("OrderType: " + Side.sell + " - " + orderType);
    //   setTemporaryOrders((prev) => ({
    //     ...prev,
    //     [price]: {
    //       side: Side.sell,
    //       type: orderType,
    //       vol: orderAmount,
    //     },
    //   }));
    //   addOrder(orderType as OrderType, Side.sell, price);
    // }
  };

  const handleBuyMarketClick = (price: number) => {
    console.log("market");
    // addOrder(Order.market, Side.buy, price);
  };
  const handleSellMarketClick = (price: number) => {
    console.log("market");
    // addOrder(Order.market, Side.sell, price);
  };

  const renderPosition = (price: number, renderSide: Side) => {
    // const pos = priceToTradesTransposed[price];

    // if (pos) {
    //   if (pos.type !== renderSide) {
    //     return null;
    //   }
    //   const currentCost = peg_price * pos.vol;
    //   const pl = currentCost - pos.cost;
    //   const name = pos.type === "sell" ? "SL" : "BL";

    //   return (
    //     <div
    //       className={
    //         pl > 0
    //           ? "flex space-x-1 border-solid border-2 border-green-400 bg-green-200 text-xs"
    //           : "flex space-x-1 border-solid border-2 border-red-400 bg-red-200 text-xs"
    //       }
    //     >
    //       <div>
    //         {name}|{Math.round(pos.vol)}|{roundPrice(pl)}
    //       </div>
    //     </div>
    //   );
    // }

    // const tempOrder = temporaryOrders[price];
    // if (tempOrder) {
    //   if (tempOrder.side !== renderSide) {
    //     return null;
    //   }

    //   const name = tempOrder.side === "sell" ? "SL" : "BL";

    //   return (
    //     <div className="flex pl-2 text-red-400 border-2 border-solid border-red-200 text-xs">
    //       <div>
    //         O|{name}|{Math.round(tempOrder.vol)}
    //       </div>
    //     </div>
    //   );
    // }

    return <span></span>;
  };

  return (
    <div className="flex rounded text-sm" style={{ height: "97vh" }}>
      <div className="flex ml-2 w-full mr-2">
        {book && (
          <>
            <div className="flex flex-col w-full">
              <div className="flex space-x-2 mb-1 mt-1">
                <input
                  type="number"
                  step="0.1"
                  min="0.001"
                  id="volume"
                  value={orderAmount}
                  onChange={handleAmountChange}
                  className="text-xs border border-solid border-2 rounded  border-gray-400 pl-2"
                ></input>
                <div className="flex items-center">
                  <Slider
                    color="green"
                    size="md"
                    value={orderAmount}
                    onChange={handleVolumeChange}
                    step={0.001}
                  />
                </div>
                <div className="flex h-6 items-center">
                  <input
                    type="checkbox"
                    name="scale"
                    id="scale"
                    checked={scaleInOut}
                    onChange={handleScaleInOutChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  ></input>
                </div>
                <div className="text-sm leading-6">
                  <label htmlFor="scale" className="font-medium text-gray-900">
                    Scale in/out
                  </label>
                </div>
                <div className="text-black-600 flex-1">
                  <div className="text-end text-lg mr-2">
                    ${roundPrice(orderAmount * peg_price, PriceDecimals[pair])}
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden flex flex-col h-full border-solid border-2 rounded border-gray-400 p-1">
                <div className="overflow-auto divide-y">
                  {data.map((x: BookPriceType, i) => (
                    <div key={i} className="divide-y">
                      <div className="border-1 flex space-x-2 divide-x">
                        <div className="flex-1 w-64">
                          {renderPosition(x.price, Side.buy)}
                        </div>
                        <div
                          className={
                            i < depth
                              ? "flex-1 pr-2 text-right text-blue-800"
                              : "flex-1 pr-2 text-right text-blue-800 cursor-pointer hover:bg-blue-100"
                          }
                          onClick={() => handleBidClick(i, x.price)}
                        >
                          {x.bid !== 0 ? x.bid : ""}
                        </div>
                        <div
                          className={
                            x.bid_ps > 0
                              ? "flex-1 w-32 text-center text-xs text-green-600"
                              : "flex-1 w-32 text-center text-xs text-red-600"
                          }
                        >
                          {x.bid_ps !== 0 ? x.bid_ps : ""}
                        </div>
                        <div className="flex-1 text-center text-gray-500">
                          {x.price !== 0 ? x.price : ""}
                        </div>
                        <div
                          className={
                            x.ask_ps > 0
                              ? "flex-1 w-32 text-center text-xs text-green-600"
                              : "flex-1 w-32 text-center text-xs text-red-600"
                          }
                        >
                          {x.ask_ps !== 0 ? x.ask_ps : ""}
                        </div>
                        <div
                          className={
                            i < depth
                              ? "flex-1 pl-2 text-left text-pink-800 cursor-pointer hover:bg-pink-100"
                              : "flex-1 pl-2 text-left text-pink-800"
                          }
                          onClick={() => handleAskClick(i, x.price)}
                        >
                          {x.ask !== 0 ? x.ask : ""}
                        </div>
                        <div className="flex-1">
                          {renderPosition(x.price, Side.sell)}
                        </div>
                      </div>
                      {i === depth - 1 ? (
                        <div
                          className="border-1 flex space-x-2"
                          style={{ backgroundColor: "lavender" }}
                        >
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Bookview;
