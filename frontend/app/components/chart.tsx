"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useKrakenDataContext } from "./kraken_data_provider";
import {
  WATCH_PAIRS,
  INTERVALS,
  INTERVALS_LABELS,
  LogLevel,
  OHLCResponseType,
} from "./commons";
import useWebSocket from "react-use-websocket";
import WsStatusIcon from "./wsstatusicon";

import { createChart } from "lightweight-charts";
import { Spinner } from "@material-tailwind/react";

export default function Chartview() {
  const parent = useRef(0);
  const candleChartRef = useRef(null);
  const volumeChartRef = useRef(null);
  const tradesCountChartRef = useRef(null);
  const [ohlcSocketUrl] = useState("ws://localhost:8000/ws_ohlc");
  const [pair, setPair] = useState(WATCH_PAIRS[0]);
  const [interval, setInterval] = useState(INTERVALS[2]);
  const [data, setData] = useState<OHLCResponseType | undefined>(undefined);
  const [inProgress, setInProgress] = useState(false);
  const { addLogMessage } = useKrakenDataContext();
  const [candleChart, setCandleChart] = useState(null);
  const [volumeChart, setVolumeChart] = useState(null);
  const [tradesChart, setTradesChart] = useState(null);
  const [candleStickSeries, setCandleStickSeries] = useState(null);
  const [volumeAreaSeries, setVolumeAreaSeries] = useState(null);
  const [tradesCountAreaSeries, setTradesCountAreaSeries] = useState(null);
  const [lastTimestamp, setLastTimestamp] = useState<number | undefined>(
    undefined
  );

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
      if (!inProgress) {
        setInProgress((prev) => {
          if (!prev) {
            console.log("fetch OHLC");
            fetch(
              `http://localhost:8000/ohlc?pair=${encodeURIComponent(
                pair
              )}&interval=${interval}`
            )
              .then((response) => response.json())
              .then((data: OHLCResponseType) => {
                setData(data);
                setLastTimestamp(new Date().getTime() / 1000);
              })
              .catch((err) => {
                addLogMessage(err.message, LogLevel.ERROR);
              })
              .finally(() => {
                setInProgress(false);
              });
          }

          return true;
        });
      }
    },
    [addLogMessage]
  );

  useEffect(() => {
    fetchOHLC(pair, interval);
  }, [pair, interval]);

  useEffect(() => {
    fetchOHLC(pair, interval);
  }, []);

  useEffect(() => {
    if (ohlcLastMessage?.data) {
      const [time, etime, open, high, low, close, vwap, volume, count] =
        JSON.parse(JSON.parse(ohlcLastMessage?.data));
      if (lastTimestamp && time > lastTimestamp) {
        if (candleStickSeries) {
          candleStickSeries.update({
            time: parseFloat(time),
            open: parseFloat(open),
            high: parseFloat(high),
            low: parseFloat(low),
            close: parseFloat(close),
          });
        }
        if (volumeAreaSeries) {
          volumeAreaSeries.update({
            time: parseFloat(time),
            value: parseFloat(volume),
          });
        }
        if (tradesCountAreaSeries) {
          tradesCountAreaSeries.update({
            time: parseFloat(time),
            value: parseFloat(count),
          });
        }
      }
    }
  }, [ohlcLastMessage?.data]);

  useEffect(() => {
    if (!candleChart && data && candleChartRef?.current) {
      const _chart = createChart(candleChartRef?.current, {
        layout: {
          textColor: "black",
          background: { type: "solid", color: "white" },
        },
      });

      const _candlestickSeries = _chart.addCandlestickSeries({
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      });

      _candlestickSeries.setData(data.candlestick);

      //   const vwapSeries = _chart.addLineSeries();
      //   vwapSeries.setData(data.vwap);
      _chart.timeScale().fitContent();

      setCandleChart(_chart);
      setCandleStickSeries(_candlestickSeries);
    }
  }, [data, candleChartRef?.current]);

  useEffect(() => {
    if (!volumeChart && data && volumeChartRef?.current) {
      const _chart = createChart(volumeChartRef?.current, {
        layout: {
          textColor: "black",
          background: { type: "solid", color: "white" },
        },
      });

      const _volumeAreaSeries = _chart.addHistogramSeries({
        color: "#32d76c",
        base: 5,
      });

      _volumeAreaSeries.setData(data.volume);

      _chart.timeScale().fitContent();

      setVolumeChart(_chart);
      setVolumeAreaSeries(_volumeAreaSeries);
    }
  }, [data, volumeChartRef?.current]);

  useEffect(() => {
    if (!tradesChart && data && tradesCountChartRef?.current) {
      const _chart = createChart(tradesCountChartRef?.current, {
        layout: {
          textColor: "black",
          background: { type: "solid", color: "white" },
        },
      });

      const _tradesCountAreaSeries = _chart.addHistogramSeries({
        color: "#ca6c29",
        base: 5,
      });

      _tradesCountAreaSeries.setData(data.trade_count);

      _chart.timeScale().fitContent();

      setTradesChart(_chart);
      setTradesCountAreaSeries(_tradesCountAreaSeries);
    }
  }, [data, volumeChartRef?.current]);

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
                {INTERVALS_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full h-full flex flex-col">
        <div
          className="w-full"
          style={{ height: "500px" }}
          ref={candleChartRef}
        />
        <div
          className="w-full"
          style={{ height: "150px" }}
          ref={volumeChartRef}
        />
        <div
          className="w-full"
          style={{ height: "150px" }}
          ref={tradesCountChartRef}
        />
      </div>

      {inProgress && <Spinner />}
    </div>
  );
}
