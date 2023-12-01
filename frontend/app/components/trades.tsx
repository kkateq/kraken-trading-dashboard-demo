import { IconButton, Tooltip } from "@material-tailwind/react";

import { useKrakenDataContext } from "./kraken_data_provider";

export default function Trades() {
  const { book, trades, roundPrice, closeTrade, flattenTrade } =
    useKrakenDataContext();

  const pegValue = book?.peg_price || 0;

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
                    <td>{roundPrice(trade.vol)}</td>
                    <td>{roundPrice(trade.entryPrice)}</td>
                    <td>{roundPrice(trade.cost)}</td>
                    <td className={`font-bold ${pegColor}`}>
                      {roundPrice(pl)}$
                    </td>
                    <td>
                      <div className="flex space-x-2 justify-end">
                        <Tooltip content="Close at market">
                          <IconButton
                            color="orange"
                            size="sm"
                            onClick={() => closeTrade(trade)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </IconButton>
                        </Tooltip>
                        <Tooltip content="Flatten">
                          <IconButton
                            color="gray"
                            size="sm"
                            onClick={() => flattenTrade(trade)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-6 h-6"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"
                              />
                            </svg>
                          </IconButton>
                        </Tooltip>
                      </div>
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
