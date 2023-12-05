"use client";
import { useState, useEffect } from "react";
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
  const [temporaryOrders, setTemporaryOrders] = useState({});

  const {
    book,
    orders,
    addOrder,
    selectedPair,
    setSelectedPair,
    priceToTradesTransposed,
    orderAmount,
    roundPrice,
  } = useKrakenDataContext();

  useEffect(() => {
    if (orders.length === 0 && Object.keys(temporaryOrders).length > 0) {
      setTemporaryOrders({});
    } else {
      const newOrders = {};
      orders.forEach((order) => {
        newOrders[order.value.descr.price] = {
          side: order.value.descr.type,
          type: order.value.vol,
          vol: orderAmount,
        };
      });

      setTemporaryOrders(newOrders);
    }
  }, [orders]);

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
    peg_price,
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
      console.log("trade for this price level already exists");
      return;
    }
    const orderType = getOrderType(Side.buy, index, depth);
    if (orderType) {
      console.log("OrderType: " + Side.buy + " - " + orderType);
      setTemporaryOrders((prev) => ({
        ...prev,
        [price]: {
          side: Side.buy,
          type: orderType,
          vol: orderAmount,
        },
      }));
      addOrder(orderType as OrderType, Side.buy, price);
    }
  };

  const handleAskClick = (index: number, price: number) => {
    const check = priceToTradesTransposed[price];
    if (check) {
      console.log("trade for this price level already exists");
      return;
    }
    const orderType = getOrderType(Side.sell, index, depth);
    if (orderType) {
      console.log("OrderType: " + Side.sell + " - " + orderType);
      setTemporaryOrders((prev) => ({
        ...prev,
        [price]: {
          side: Side.sell,
          type: orderType,
          vol: orderAmount,
        },
      }));
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

  const renderPosition = (price: number, renderSide: Side) => {
    const pos = priceToTradesTransposed[price];

    if (pos) {
      if (pos.type !== renderSide) {
        return null;
      }
      const currentCost = peg_price * pos.vol;
      const pl = currentCost - pos.cost;
      const name = pos.type === "sell" ? "SL" : "BL";

      return (
        <div
          className={
            pl > 0
              ? "flex space-x-1 border-solid border-2 border-green-400 bg-green-200 text-xs"
              : "flex space-x-1 border-solid border-2 border-red-400 bg-red-200 text-xs"
          }
        >
          <div>
            {name}|{Math.round(pos.vol)}|{roundPrice(pl)}
          </div>
        </div>
      );
    }

    const tempOrder = temporaryOrders[price];
    if (tempOrder) {
      if (tempOrder.side !== renderSide) {
        return null;
      }

      const name = tempOrder.side === "sell" ? "SL" : "BL";

      return (
        <div className="flex pl-2 text-red-400 border-2 border-solid border-red-200 text-xs">
          <div>
            O|{name}|{Math.round(tempOrder.vol)}
          </div>
        </div>
      );
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
        <div className="mt-2 text-xs">
          <h2 className="text-gray-600 mb-1">Order book depth {depth}</h2>
        </div>
      </div>
    </div>
  );
};

export default Bookview;
