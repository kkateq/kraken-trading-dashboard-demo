"use client;";
import {
  createContext,
  useState,
  useContext,
  useRef,
  useCallback,
  useEffect,
} from "react";
import WsStatusIcon from "./wsstatusicon";

import useWebSocket, { ReadyState } from "react-use-websocket";

type Props = {
  pair: string;
  depth: number;
};

export default function Krakenbook({ pair, depth }: Props) {
  const didUnmount = useRef(false);
  const [krakenWsUrl] = useState("wss://ws.kraken.com/");
  const [channelId, setChannelId] = useState(undefined);
  const [error, setError] = useState(undefined);
  const handleReconnectStop = useCallback(() => sendMessage("Hello"), []);
  const [bids, setBids] = useState(undefined);
  const [asks, setAsks] = useState(undefined);
  const { sendMessage, lastMessage, lastJsonMessage, readyState } =
    useWebSocket(krakenWsUrl, {
      heartbeat: {
        message: "ping",
        returnMessage: "pong",
        timeout: 60000, // 1 minute, if no response is received, the connection will be closed
        interval: 25000, // every 25 seconds, a ping message will be sent
      },
      onReconnectStop: handleReconnectStop,
      shouldReconnect: (closeEvent) => {
        /*
      useWebSocket will handle unmounting for you, but this is an example of a
      case in which you would not want it to automatically reconnect
    */
        return didUnmount.current === false;
      },
      reconnectAttempts: 10,
      reconnectInterval: 3000,
      retryOnError: true,
    });

  useEffect(() => {
    sendMessage(
      JSON.stringify({
        event: "subscribe",
        pair: ["MATIC/USD"],
        subscription: {
          name: "book",
          depth: depth,
        },
      })
    );
    return () => {
      didUnmount.current = true;
    };
  }, []);

  const isObject = (value: any) => {
    return typeof value === "object" && !Array.isArray(value) && value !== null;
  };

  const convertToMap = (arr: [any]) => {
    const transposed = arr.reduce((acc, trade) => {
      // @ts-ignore
      if (!acc) {
        acc = {};
      }
      if (trade) {
        acc[parseFloat(trade[0])] = trade;
      }
      return acc;
    }, {});

    return transposed;
  };

  const updateBids = (new_bids: [any]) => {
    if (bids) {
      const _bids = { ...bids };

      new_bids.forEach((el) => {
        _bids[parseFloat(el[0])] = el;
      });

      // @ts-ignore
      setBids(_bids);
    }
  };

  const updateAsks = (new_asks: [any]) => {
    if (asks) {
      const _asks = { ...asks };

      new_asks.forEach((el) => {
        _asks[parseFloat(el[0])] = el;
      });

      // @ts-ignore
      setAsks(_asks);
    }
  };

  useEffect(() => {
    if (lastMessage?.data) {
      const data = JSON.parse(lastMessage?.data);
      //   debugger;
      if (
        isObject(data) &&
        data.event === "subscriptionStatus" &&
        data.pair === pair
      ) {
        if (
          data.status === "subscribed" &&
          data.channelName === `book-${depth}` &&
          data.channelID
        ) {
          setChannelId(data.channelID);
        } else if (data.status === "error") {
          setError(data.errorMessage);
        }
      } else {
        if (Array.isArray(data)) {
          const [_channelId, value, name, _pair] = data;
          if (
            _channelId === channelId &&
            _pair === pair &&
            name === `book-${depth}`
          ) {
            if (
              !bids &&
              !asks &&
              value?.as &&
              value.as.length === depth &&
              value?.bs &&
              value.bs.length === depth
            ) {
              setBids(convertToMap(value?.bs));
              setAsks(convertToMap(value?.as));
            } else {
              if (value?.b) {
                updateBids(value.b);
              }
              if (value?.a) {
                updateAsks(value.a);
              }
            }
          }
        }
      }
    }
  }, [lastMessage?.data]);

  const renderBids = () => {
    if (!bids) {
      return null;
    }
    const keys = Object.keys(bids).sort().reverse();
    return (
      <>
        {keys.map((price) => {
          const vol = Math.round(bids[price][1]);
          return (
            <div key={price} className="flex text-blue-800">
              <div className="flex-1 text-right">
                {Math.round(bids[price][1])}
              </div>
              <div className="flex-1 text-center">{price}</div>
              <div className="flex-1"></div>
            </div>
          );
        })}
      </>
    );
  };

  const renderAsks = () => {
    if (!asks) {
      return null;
    }

    const keys = Object.keys(asks).sort().reverse();
    return (
      <>
        {keys.map((price) => {
          const vol = Math.round(asks[price][1]);
          return vol > 0 ? (
            <div key={price} className="flex text-red-800">
              <div className="flex-1"></div>
              <div className="flex-1 text-center">{price}</div>
              <div className="flex-1 text-left">{vol}</div>
            </div>
          ) : null;
        })}
      </>
    );
  };

  return (
    <div className="flex" style={{ width: "800px" }}>
      <WsStatusIcon readyState={readyState} />
      {error && <div className="text-red-900">{error}</div>}
      <div className="bg-white overflow-hidden flex flex-col h-full border-solid border-2 rounded border-gray-400 p-1 w-full">
        <div>
          {renderAsks()}
          <div>mid</div>
          {renderBids()}
        </div>
      </div>
    </div>
  );
}
