import { useState, useEffect } from "react";

type Props = {
  pegValue: number;
};
export default function Trades({ pegValue }: Props) {
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

  const round = (v: number, prec: number = 100) => Math.round(v * prec) / prec;

  return (
    <div className="flex flex-col overflow-auto h-full bg-gray-200 border-2 rounded border-blue-400 p-2">
      <div>
        <h5 className="text-xs text-gray-400 bold text-center mb-1">
          POSITIONS
        </h5>
        <table className="w-full min-w-max table-auto text-left text-xs ">
          <thead className="">
            <tr>
              <th>Pair</th>
              <th>Type</th>
              <th>Volume</th>
              <th>Entry Price</th>
              <th>Cost</th>
              <th>Lev</th>
              <th>P/L</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {trades &&
              trades.length > 0 &&
              trades.map((trade, i) => {
                const currentCost = pegValue * trade.vol;
                const pl =
                  trade.type === "buy"
                    ? currentCost - trade.cost
                    : trade.cost - currentCost;
                const pegColor = pl > 0 ? "text-green-700" : "text-red-700";
                return (
                  <tr key={i}>
                    <td className="text-sky-800 bold">{trade.pair}</td>
                    <td
                      className={
                        trade.type === "buy"
                          ? "text-green-600"
                          : "text-pink-600"
                      }
                    >
                      {trade.type}
                    </td>
                    <td>{round(trade.vol)}</td>
                    <td>{round(trade.cost / trade.vol, 10000)}</td>
                    <td>{round(trade.cost)}</td>
                    <td>{round(trade.leverage)}</td>
                    <td className={`font-bold ${pegColor}`}>{round(pl)}$</td>
                    <td>
                      <button>Close</button>
                    </td>
                  </tr>
                );
              })}
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
