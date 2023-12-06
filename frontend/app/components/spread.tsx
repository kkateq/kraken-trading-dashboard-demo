"use client";
import { useEffect, useCallback, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import WsStatusIcon from "./wsstatusicon";
type Props = {
  pair: string;
};
import { debounce } from "lodash";
//@ts-ignore
import Plot from "react-plotly.js";

export default function Spread({ pair }: Props) {
  const [spreadSocketUrl] = useState("ws://localhost:8000/ws_spread");
  const [data, setData] = useState([]);
  const { lastMessage: spreadLastMessage, readyState } = useWebSocket(
    spreadSocketUrl,
    {
      queryParams: { pair: pair },
    }
  );

  const debouncedSetDataHandler = useCallback(debounce(setData, 300), []);

  useEffect(() => {
    if (spreadLastMessage?.data) {
      debouncedSetDataHandler(JSON.parse(JSON.parse(spreadLastMessage?.data)));
    }
  }, [spreadLastMessage?.data]);

  const [bid, ask, time, bidVol, askVol] = data;

  const renderGraph = () => (
    <Plot
      data={[
        {
          x: [1, 2, 3],
          y: [2, 6, 3],
          type: "scatter",
          mode: "lines+markers",
          marker: { color: "red" },
        },
        { type: "bar", x: [1, 2, 3], y: [2, 5, 3] },
      ]}
      layout={{ width: 320, height: 240, title: "A Fancy Plot" }}
    />
  );

  return (
    <div className="flex">
      <WsStatusIcon readyState={readyState} />
      <div>
        <div>Bid : {bid}</div>
        <div>Ask : {ask}</div>
        <div>Bid : {bidVol}</div>
        <div>Ask : {askVol}</div>
        {renderGraph()}
      </div>
    </div>
  );
}
