// "use client";

import { useState, useEffect } from "react";
export default function Trades() {
  const [trades, setTrades] = useState([]);

  const fetchData = () => {
    fetch("http://localhost:8000/positions")
      .then((response) => response.json())
      .then((data) => {
        setTrades(data);
        console.log(data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const round = (v: number) => Math.round(v * 100) / 100;

  return (
    <div className="flex flex-col overflow-auto h-full bg-gray-200 border-2 rounded border-gray-400 p-2 m-1">
      <div>
        <table className="w-full min-w-max table-auto text-left text-sm ">
          <thead className="">
            <tr>
              <th>Pair</th>
              <th>Type</th>
              <th>Volume</th>
              <th>Cost</th>
              <th>Fee</th>
              <th>Lev</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {trades &&
              trades.length > 0 &&
              trades.map((trade, i) => (
                <tr key={i} className="m-">
                  <td className="text-sky-800 bold">{trade.pair}</td>
                  <td
                    className={
                      trade.type === "buy" ? "text-green-600" : "text-pink-600"
                    }
                  >
                    {trade.type}
                  </td>
                  <td>{round(trade.vol)}</td>
                  <td>{round(trade.cost)}</td>
                  <td>{round(trade.fee)}</td>
                  <td>{round(trade.leverage)}</td>
                  <td>{round(trade.margin)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {trades.length === 0 && (
        <div className="h-full grid items-center justify-items-center text-xs">
          <div>No trades</div>
        </div>
      )}
    </div>
  );
}
