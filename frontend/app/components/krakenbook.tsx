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
import _ from "lodash";
import useWebSocket, { ReadyState } from "react-use-websocket";
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
  timestamp: string;
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
  const [error, setError] = useState<string | undefined>(undefined);
  const handleReconnectStop = useCallback(() => sendMessage("Hello"), []);
  const [book, setBook] = useState<BookType | undefined>(undefined);

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
  }, [depth, sendMessage]);

  const isObject = (value: any) => {
    return typeof value === "object" && !Array.isArray(value) && value !== null;
  };

  const updateBook = useCallback(
    (
      updateList: [UpdateRecord] | undefined,
      side: Side,
      checksum: string = ""
    ) => {
      if (!updateList) {
        return;
      }

      var updatedBook = book ? { ...book } : {};
      if (!updatedBook[side]) {
        updatedBook = { ...updateBook, [side]: {} };
      }

      const updateSideObj = updatedBook[side];
      if (updateSideObj) {
        updateList.forEach((el: UpdateRecord) => {
          const vol = parseFloat(el[1]);
          const timestamp = parseFloat(el[2]);
          if (vol > 0) {
            const prevTimestamp = updateSideObj[el[0]]
              ? updateSideObj[el[0]].timestamp
              : null;
            if (
              !prevTimestamp ||
              (prevTimestamp &&
                parseFloat(prevTimestamp) < parseFloat(timestamp))
            ) {
              updateSideObj[el[0]] = {
                price: el[0],
                volume: el[1],
                timestamp: el[2],
                type: side,
              };
            }
          } else {
            delete updateSideObj[el[0]];
          }
        });

        setBook((prev: BookType) => ({
          ...(prev || {}),
          [side]: updateSideObj,
          checksum,
        }));
      }
    },
    [book]
  );

  const makeCRCTable = () => {
    var c;
    var crcTable = [];
    for (var n = 0; n < 256; n++) {
      c = n;
      for (var k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crcTable[n] = c;
    }
    return crcTable;
  };

  const crc32 = useCallback((str: string) => {
    var crcTable = window.crcTable || (window.crcTable = makeCRCTable());
    var crc = 0 ^ -1;

    for (var i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff];
    }

    return (crc ^ -1) >>> 0;
  }, []);

  const parsePrice = (p: string) => parseInt(p.replace(".", "")).toString();

  const reduceTrade = useCallback(
    (_book: BookType, side: Side): string => {
      if (!book) {
        return "";
      }
      const top_10 = _.slice(_.keys(_book[side]), 0, 10);
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
    },
    [book]
  );

  const isBookValid = useCallback(
    (b: BookType, checksum: string): boolean => {
      const res = reduceTrade(b, Side.ASK) + reduceTrade(b, Side.BID);

      const p32 = crc32(res);
      return p32.toString() === checksum;
    },
    [crc32, reduceTrade]
  );

  useEffect(() => {
    if (book?.checksum) {
      const isValid = isBookValid(book, book.checksum);

      if (!isValid) {
        setError("Book is invalid. Resubscribing...");

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
      } else {
        setError("");
      }
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
              updateBook(value?.bs, Side.BID);
              updateBook(value?.as, Side.ASK);
            } else {
              if (value?.b) {
                updateBook(value.b, Side.BID, value.c);
              }
              if (value?.a) {
                updateBook(value.a, Side.ASK, value.c);
              }
            }
          }
        }
      }
    }
  }, [lastMessage?.data]);

  return (
    <div>
      <div>
        <WsStatusIcon readyState={readyState} />
        <div>{error}</div>
      </div>
      {/* <Bookview book={book} />; */}
    </div>
  );
}
