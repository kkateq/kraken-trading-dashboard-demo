import { useEffect, useState } from "react";
import { Order, OrderType, Side, Leverage } from "./commons";
import { Slider } from "@material-tailwind/react";
import { useKrakenDataContext } from "./kraken_data_provider";

export const OrderForm = () => {
  const [orderType, setOrderType] = useState<OrderType>();
  const [simpleForm, setSimpleForm] = useState<boolean>(true);
  const [price, setPrice] = useState(0);
  const [total, setTotal] = useState(0);
  const {
    orderAmount,
    scaleInOut,
    setOrderAmount,
    setScaleInOut,
    cancelAllPendingOrders,
    book,
    addOrder,
  } = useKrakenDataContext();

  useEffect(() => {
    if (book?.pair) {
      setPrice(book.peg_price);
    }
  }, [book?.pair, book?.peg_price]);

  const handleOrderTypeSelection = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setOrderType(e.target.value as OrderType);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderAmount(e.target.value as any);
  };

  const handleScaleInOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScaleInOut(!scaleInOut);
  };

  const handleSimpleForm = () => {
    setSimpleForm(!simpleForm);
  };

  const handleBuy = () => {
    const orderType = Side.buy;
    addOrder(orderType as OrderType, Side.sell, price);
  };

  const handleSell = () => {
    console.log("sell");
  };
  const handleCancelAll = () => {
    cancelAllPendingOrders();
  };
  const handleFlatten = () => {
    console.log("flatten");
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrderAmount(e.target.value as any);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrice(e.target.value as any);
  };

  useEffect(() => {
    if (book?.peg_price) {
      const newTotal =
        Math.round(orderAmount * book?.peg_price * 10000) / 10000;
      if (newTotal !== total) {
        setTotal(Math.round(orderAmount * book?.peg_price * 10000) / 10000);
      }
    }
  }, [orderAmount, book, total]);

  return (
    <div className="mt-2 border-solid border-2 border-gray-400 rounded p-2 bg-white">
      <h4 className="mb-2 text-gray-500">Order settings</h4>
      <div className="pb-2 grid space-y-3">
        <input
          type="number"
          step="0.1"
          min="0.001"
          value={orderAmount}
          onChange={handleAmountChange}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 p-2"
        ></input>

        <div className="pb-2 pt-2 flex">
          <Slider
            color="green"
            size="md"
            value={orderAmount}
            onChange={handleVolumeChange}
            step={0.001}
          />
        </div>
        <div>
          <span className="bold text-green-700 text-lg">$ {total}</span>
        </div>
        <div className="relative flex gap-x-3">
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
        </div>

        {!simpleForm && (
          <>
            <select
              id="orderTypeSelect"
              onChange={handleOrderTypeSelection}
              value={orderType}
              className="p-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
            >
              <option value={Order.limit}>limit</option>
              <option value={Order.market}>market</option>
              <option value={Order.stopLoss}>stop loss</option>
              <option value={Order.takeProfit}>take profit loss</option>
            </select>

            <input
              type="number"
              step="0.1"
              min="0.001"
              value={price}
              onChange={handlePriceChange}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 p-2"
            ></input>
            <button
              type="button"
              onClick={handleBuy}
              className="rounded-md bg-blue-600 px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              BUY
            </button>
            <button
              type="button"
              onClick={handleSell}
              className="rounded-md bg-pink-600 px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-pink-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              SELL
            </button>
          </>
        )}
        <button
          type="button"
          onClick={handleCancelAll}
          className="rounded-md bg-cyan-300 px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          CANCEL PENDING ORDERS
        </button>
        <button
          type="button"
          onClick={handleCancelAll}
          className="rounded-md bg-orange-600 px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          CLOSE POSITIONS AT MARKET
        </button>
        <button
          type="button"
          onClick={handleFlatten}
          className="rounded-md bg-gray-600 px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          FLATTEN POSITIONS
        </button>

        <div className="relative flex gap-x-3">
          <div className="flex h-6 items-center">
            <input
              type="checkbox"
              name="simpleForm"
              id="simpleForm"
              checked={simpleForm}
              onChange={handleSimpleForm}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            ></input>
          </div>
          <div className="text-sm leading-6">
            <label htmlFor="simpleForm" className="font-medium text-blue-700">
              Simple form
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
