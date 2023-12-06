"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useKrakenDataContext } from "./kraken_data_provider";
import { WATCH_PAIRS, INTERVALS, LogLevel } from "./commons";
import useWebSocket from "react-use-websocket";
import WsStatusIcon from "./wsstatusicon";
import { debounce } from "lodash";
import Chart from "react-apexcharts";

export default function Chartview() {
  const parent = useRef(0);
  const [ohlcSocketUrl] = useState("ws://localhost:8000/ws_ohlc");
  const [pair, setPair] = useState(WATCH_PAIRS[0]);
  const [interval, setInterval] = useState(5);
  const [data, setData] = useState(undefined);
  const { addLogMessage } = useKrakenDataContext();

  const { lastMessage: ohlcLastMessage, readyState } = useWebSocket(
    ohlcSocketUrl,
    {
      queryParams: { pair: pair, interval: interval },
    }
  );

  const handlePairChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPair(e.target.value as any);
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInterval(e.target.value as any);
  };

  const fetchOHLC = useCallback(
    (pair: string, interval: number) => {
      console.log("fetched OHLC");
      fetch(
        `http://localhost:8000/ohlc?pair=${encodeURIComponent(
          pair
        )}&interval=${interval}`
      )
        .then((response) => response.json())
        .then((data) => {
          setData(data);
        })
        .catch((err) => {
          addLogMessage(err.message, LogLevel.ERROR);
        });
    },
    [addLogMessage]
  );

  const debouncedFetchHandler = useCallback(debounce(fetchOHLC, 300), []);

  useEffect(() => {
    debouncedFetchHandler(pair, interval);
  }, [pair, interval]);

  //   useEffect(() => {
  //     if (ohlcLastMessage?.data) {
  //       debugger;
  //       console.log(JSON.parse(ohlcLastMessage?.data));
  //     }
  //   }, [ohlcLastMessage?.data]);

  const ds = {
    options: {
      xaxis: {
        type: "datetime",
      },
    },
    series: [
      {
        data: data || [],
      },
    ],
  };

  return (
    <div ref={parent} className="border-solid border-2 border-gray-300 m-2">
      <div className="flex p-2 space-x-1">
        <WsStatusIcon readyState={readyState} />
        <div className="flex border-solid border-2 rounded border-gray-400">
          <select id="pair" onChange={handlePairChange} value={pair}>
            {WATCH_PAIRS.map((v, i) => (
              <option value={v} key={i}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex border-solid border-2 rounded border-gray-400">
          <select
            id="interval"
            onChange={handleIntervalChange}
            value={interval}
          >
            {INTERVALS.map((v, i) => (
              <option value={v} key={i}>
                {v} min
              </option>
            ))}
          </select>
        </div>
      </div>
      {!data && <div>No data</div>}
      {data && (
        <Chart
          options={ds.options}
          series={ds.series}
          type="candlestick"
          width={parent.current ? parent.current.clientWidth : 1000}
        />
      )}
    </div>
  );
}
