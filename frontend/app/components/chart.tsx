"use client";

import { useEffect, useCallback } from "react";
import { useKrakenDataContext } from "./kraken_data_provider";
import { useState } from "react";
import { WATCH_PAIRS, INTERVALS, LogLevel } from "./commons";
import useWebSocket, { ReadyState } from "react-use-websocket";
import WsStatusIcon from "./wsstatusicon";

export default function Chart() {
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

  useEffect(() => {
    if (ohlcLastMessage?.data) {
      console.log("fetched OHLC");

      fetchOHLC(pair, interval);
    }
  }, [ohlcLastMessage]);

  //   useEffect(() => {
  //     if (ohlcLastMessage?.data) {
  //       debugger;
  //       console.log(JSON.parse(ohlcLastMessage?.data));
  //     }
  //   }, [ohlcLastMessage?.data]);

  const selectedPairData = data ? data[pair] : undefined;

  return (
    <div>
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
        <select id="interval" onChange={handleIntervalChange} value={interval}>
          {INTERVALS.map((v, i) => (
            <option value={v} key={i}>
              {v} min
            </option>
          ))}
        </select>
      </div>
      {!selectedPairData ? <div>No data</div> : Chart}
    </div>
  );
}
