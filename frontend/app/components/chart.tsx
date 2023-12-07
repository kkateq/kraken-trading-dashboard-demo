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

import Chart from "react-apexcharts";
import { Spinner } from "@material-tailwind/react";

export default function Chartview() {
  const parent = useRef(0);
  const [ohlcSocketUrl] = useState("ws://localhost:8000/ws_ohlc");
  const [pair, setPair] = useState(WATCH_PAIRS[0]);
  const [interval, setInterval] = useState(INTERVALS[1]);
  const [data, setData] = useState<OHLCResponseType | undefined>(undefined);
  const [inProgress, setInProgress] = useState(false);
  const [lastTimeCall, seLastTimeCall] = useState(undefined);
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

  const shouldFetch = (currentTime: number) => {
    if (!lastTimeCall) {
      return true;
    } else {
      const delta = lastTimeCall - currentTime;
      const intervalSeconds = interval * 60;
      const res = delta > intervalSeconds;
      return res;
    }
  };

  const fetchOHLC = useCallback(
    (pair: string, interval: number) => {
      const currentTime = new Date().getTime() / 1000;
      if (!inProgress && shouldFetch(currentTime)) {
        setInProgress(true);

        console.log("fetch OHLC");
        fetch(
          `http://localhost:8000/ohlc?pair=${encodeURIComponent(
            pair
          )}&interval=${interval}`
        )
          .then((response) => response.json())
          .then((data: OHLCResponseType) => {
            setData(data);
            data.candlestick.forEach((entry) => {
              entry.x = new Date(entry.x * 1000);
            });
            data.trade_count.forEach((entry) => {
              entry.x = new Date(entry.x * 1000);
            });
            data.volume.forEach((entry) => {
              entry.x = new Date(entry.x * 1000);
            });
            data.vwap.forEach((entry) => {
              entry.x = new Date(entry.x * 1000);
            });
            setInProgress(false);
            seLastTimeCall(currentTime);
          })
          .catch((err) => {
            addLogMessage(err.message, LogLevel.ERROR);
          });
      }
    },
    [addLogMessage]
  );

  useEffect(() => {
    if (lastTimeCall) {
      fetchOHLC(pair, interval);
    }
  }, [pair, interval]);

  useEffect(() => {
    fetchOHLC(pair, interval);
  }, []);

  useEffect(() => {
    if (ohlcLastMessage?.data) {
      fetchOHLC(pair, interval);
    }
  }, [ohlcLastMessage?.data]);

  const ds = {
    options: {
      chart: {
        id: "candles",
        type: "candlestick",
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      xaxis: {
        type: "datetime",
        lines: {
          show: true,
        },
      },
    },
    series: [
      {
        data: data?.candlestick || [],
      },
    ],
  };

  const volumeChartConfig = {
    options: {
      chart: {
        height: 160,
        type: "bar",
        brush: {
          enabled: true,
          target: "candles",
        },
        selection: {
          enabled: true,
          fill: {
            color: "#ccc",
            opacity: 0.4,
          },
          stroke: {
            color: "#0D47A1",
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      plotOptions: {
        bar: {
          columnWidth: "80%",
          colors: {
            ranges: [
              {
                from: -1000,
                to: 0,
                color: "#F15B46",
              },
              {
                from: 1,
                to: 10000,
                color: "#FEB019",
              },
            ],
          },
        },
      },
      stroke: {
        width: 0,
      },
      xaxis: {
        type: "datetime",
        axisBorder: {
          offsetX: 13,
        },
      },
      yaxis: {
        labels: {
          show: false,
        },
      },
    },
    series: [
      {
        data: data?.volume || [],
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
                {INTERVALS_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {data && !inProgress && (
        <div>
          <Chart
            options={ds.options}
            series={ds.series}
            type="candlestick"
            width={parent.current ? parent.current.clientWidth : 1000}
          />
          <Chart
            options={volumeChartConfig.options}
            series={volumeChartConfig.series}
            type="bar"
            width={parent.current ? parent.current.clientWidth : 1000}
            height="150"
          />
        </div>
      )}
      {inProgress && <Spinner />}
    </div>
  );
}
