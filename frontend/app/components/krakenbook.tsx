"use client;";
import { useState, useRef, useCallback, useEffect } from "react";
import WsStatusIcon from "./wsstatusicon";
import _ from "lodash";
import useWebSocket from "react-use-websocket";
import { crc32, parsePrice } from "./utils";
import Bookview from "./bookview";

type Props = {
  pair: string;
  depth: number;
};

export enum Side {
  BID = "bid",
  ASK = "ask",
}

type BookEntryType = {
  price: string;
  volume: string;
  timestamp: number;
  type: Side;
};

type BookType = {
  ask: { [price: string]: BookEntryType };
  bid: { [price: string]: BookEntryType };
  checksum: string;
};

type UpdateRecord = [string, string, string, string];

export default function Krakenbook({ pair, depth }: Props) {
  const didUnmount = useRef(false);
  const [krakenWsUrl] = useState("wss://ws.kraken.com/");
  const [channelId, setChannelId] = useState(undefined);
  const [valid, setValid] = useState<boolean>(false);
  const handleReconnectStop = useCallback(() => sendMessage("Hello"), []);
  const [book, setBook] = useState<BookType>();

  const { sendMessage, lastMessage, readyState } = useWebSocket(krakenWsUrl, {
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
        pair: [pair],
        subscription: {
          name: "book",
          depth: depth,
        },
      })
    );
    return () => {
      didUnmount.current = true;
    };
  }, [depth, sendMessage, pair]);

  const isObject = (value: any) => {
    return typeof value === "object" && !Array.isArray(value) && value !== null;
  };

  const setupBook = (bs: [UpdateRecord], as: [UpdateRecord]) => {
    const newBook = { bid: {}, ask: {}, checksum: "" };

    bs.forEach((el: UpdateRecord) => {
      newBook.bid[el[0]] = {
        price: el[0],
        volume: el[1],
        timestamp: +el[2],
        type: "bid",
      };
    });

    as.forEach((el: UpdateRecord) => {
      newBook.ask[el[0]] = {
        price: el[0],
        volume: el[1],
        timestamp: +el[2],
        type: "ask",
      };
    });

    setBook(newBook);
  };

  const updateBook = useCallback(
    (
      updateList: [UpdateRecord] | undefined,
      side: Side,
      checksum: string = ""
    ) => {
      if (!updateList || !book || !book?.ask || !book?.bid) {
        return;
      }

      var updatedBook = { ...book };

      const updateSideObj = updatedBook[side];
      if (updateSideObj) {
        updateList.forEach((el: UpdateRecord) => {
          const price = el[0];
          const vol = +el[1];
          const timestamp = +el[2];
          const entry = updateSideObj[price];
          const entryExists = !!entry;

          if (vol === 0 && entryExists) {
            delete updateSideObj[price];
          } else if (
            !entryExists ||
            (entryExists && entry.timestamp < timestamp)
          ) {
            updateSideObj[price] = {
              price: price,
              volume: el[1],
              timestamp: timestamp,
              type: side,
            };
          }
        });

        //@ts-ignore
        setBook((prev: BookType) => ({
          ...(prev || {}),
          [side]: updateSideObj,
          checksum,
        }));
      }
    },
    [book]
  );

  const reduceTrade = (_book: BookType, side: Side): string => {
    if (!_book) {
      return "";
    }
    const sortedKeys = _.keys(_book[side]).sort(
      side === Side.ASK
        ? (a: string, b: string) => +a - +b
        : (a: string, b: string) => +b - +a
    );
    const top_10 = _.slice(sortedKeys, 0, 10);
    return top_10.reduce((acc, price: string) => {
      // @ts-ignore
      if (!acc) {
        acc = "";
      }

      const a1 = parsePrice(price);
      const v1 = parsePrice(_book[side][price].volume);
      acc = acc + a1 + v1;

      return acc;
    }, "");
  };

  const isBookValid = (b: BookType, checksum: string): boolean => {
    const res = reduceTrade(b, Side.ASK) + reduceTrade(b, Side.BID);

    const p32 = crc32(res);
    return p32.toString() === checksum;
  };

  useEffect(() => {
    if (book?.checksum) {
      const isValid = isBookValid(book, book.checksum);
      setValid(isValid);
    }
  }, [book?.checksum]);

  useEffect(() => {
    if (lastMessage?.data) {
      const data = JSON.parse(lastMessage?.data);
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
              !book &&
              value?.as &&
              value.as.length === depth &&
              value?.bs &&
              value.bs.length === depth
            ) {
              setupBook(value?.bs, value?.as);
            } else {
              if (book && value?.b) {
                updateBook(value.b, Side.BID, value.c);
              }
              if (book && value?.a) {
                updateBook(value.a, Side.ASK, value.c);
              }
            }
          }
        }
      }
    }
  }, [lastMessage?.data]);

  const getBookSorted = () => {
    if (!book) {
      return null;
    }
    const sortedAskKeys = _.keys(book.ask).sort(
      (a: string, b: string) => +a - +b
    );
    const top_asks = _.slice(sortedAskKeys, 0, depth).reverse();
    var ask_volume = 0;

    const asks_list = top_asks.reduce((acc, price: string) => {
      // @ts-ignore
      if (!acc) {
        acc = [];
      }

      const element = book.ask[price];
      if (element) {
        ask_volume = ask_volume + +element.volume;
        //@ts-ignore
        acc.push({
          bid: "",
          price: +element.price,
          ask: Math.round(+element.volume),
          type: element.type,
        });
      }

      return acc;
    }, []);

    const sortedBidKeys = _.keys(book.bid).sort(
      (a: string, b: string) => +b - +a
    );
    const top_bids = _.slice(sortedBidKeys, 0, depth);
    var bid_volume = 0;
    const bids_list = top_bids.reduce((acc, price: string) => {
      // @ts-ignore
      if (!acc) {
        acc = [];
      }

      const element = book.bid[price];
      if (element) {
        bid_volume = bid_volume + +element.volume;
        //@ts-ignore
        acc.push({
          ask: "",
          price: +element.price,
          bid: Math.round(+element.volume),
          type: element.type,
        });
      }

      return acc;
    }, []);

    const ask_volume_total_percentage =
      (ask_volume / (ask_volume + bid_volume)) * 100;

    const best_bid = +book.bid[top_bids[0]].price;
    const best_ask = +book.ask[top_asks[top_asks.length - 1]].price;

    const peg_price = (best_ask + best_bid) / 2;
    return {
      data: [...asks_list, ...bids_list],
      depth,
      ask_volume_total: Math.round(ask_volume),
      bid_volume_total: Math.round(bid_volume),
      ask_volume_total_percentage: Math.round(ask_volume_total_percentage),
      bids_volume_total_percentage: Math.round(
        100 - ask_volume_total_percentage
      ),
      peg_price,
      pair,
      best_ask,
      best_bid,
    };
  };

  return (
    <div className="h-full ">
      <Bookview book={getBookSorted()} />
      <div className="flex items-center ml-2 space-x-2 text-gray-600 text-xs divide-x">
        <WsStatusIcon readyState={readyState} />
        <h2 className="text-xs">Depth: {depth}</h2> <div>|</div>
        <div className="text-xs">
          Checksum:{" "}
          {valid ? (
            <span className="text-green-600">valid</span>
          ) : (
            <span className="text-red-600">invalid</span>
          )}
        </div>
        <div>|</div>
        <div>Pair: {pair}</div>
      </div>
    </div>
  );
}
