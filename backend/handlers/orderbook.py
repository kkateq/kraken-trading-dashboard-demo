from kraken.spot import OrderbookClientV2
import asyncio
import json
import time

order_book_websocket = None
prev_book = None
imbalance_history = []
large_volume_history = []

BID_TYPE = 1
ASK_TYPE = -1
PULLING_STACKING_CLEANUP_INTERVAL = 50


def pulling_stacking(book):
    global prev_book

    try:
        for b in book:
            price = b["price"]
            if b["ask"] != 0:
                prev_ask = (
                    prev_book[price]["ask"] if prev_book and price in prev_book else 0
                )
                ask_ps = b["ask"] - prev_ask

                if (
                    prev_book
                    and ask_ps == 0
                    and price in prev_book
                    and "ask_ps" in prev_book[price]
                    and "ask_ps_history" in prev_book[price]
                    and prev_book[price]["ask_ps_history"]
                    < PULLING_STACKING_CLEANUP_INTERVAL
                ):
                    b["ask_ps"] = prev_book[price]["ask_ps"]
                    b["ask_ps_history"] = prev_book[price]["ask_ps_history"] + 1

                else:
                    b["ask_ps"] = ask_ps

            if b["bid"] != 0:
                prev_bid = (
                    prev_book[price]["bid"] if prev_book and price in prev_book else 0
                )
                bid_ps = b["bid"] - prev_bid
                if (
                    prev_book
                    and bid_ps == 0
                    and price in prev_book
                    and "bid_ps" in prev_book[price]
                    and "bid_ps_history" in prev_book[price]
                    and prev_book[price]["bid_ps_history"]
                    < PULLING_STACKING_CLEANUP_INTERVAL
                ):
                    b["bid_ps"] = prev_book[price]["bid_ps"]
                    b["bid_ps_history"] = prev_book[price]["bid_ps_history"] + 1
                else:
                    b["bid_ps"] = bid_ps

    except Exception as e:
        print("An exception occurred: ", e)


def calculate_imbalance(bid_volume, ask_volume):
    best_bid_volume = bid_volume[0]
    best_ask_volume = ask_volume[0]

    imbalance = (best_bid_volume - best_ask_volume) / (
        best_bid_volume + best_ask_volume
    )
    t = time.time()
    imbalance_history.append({"time": t, "value": imbalance})
    large_volume_history.append(
        {
            "time": t,
            "value": best_bid_volume
            if imbalance > 0.5
            else (best_ask_volume if imbalance < -0.5 else 0),
        }
    )


def transform_book(book, depth, pair, checksum):
    bids = [(float(i[0]), float(i[1][0])) for i in list(book["bid"].items())]
    asks = [(float(j[0]), float(j[1][0])) for j in list(book["ask"].items())]
    bid_volume = [round(j) for _, j in bids]
    ask_volume = [round(j) for _, j in asks]
    bid_price = [i for i, _ in bids]
    ask_price = [i for i, _ in asks]
    calculate_imbalance(bid_volume, ask_volume)
    peg_price = (bid_price[0] + ask_price[0]) / 2
    best_bid = bid_price[0]
    best_ask = ask_price[0]

    ask_volume.reverse()
    ask_price.reverse()

    bid_volume_total = round(sum(j for _, j in bids))
    ask_volume_total = round(sum(j for _, j in asks))

    order_book_depth = depth
    bids = [0] * order_book_depth + bid_volume
    price = ask_price + bid_price
    asks = ask_volume + [0] * order_book_depth
    res = []

    for bid, price, ask in zip(bids, price, asks):
        res.append(
            {
                "bid": bid,
                "price": price,
                "ask": ask,
                "ask_ps": 0,
                "bid_ps": 0,
                "ask_ps_history": 0,
                "bid_ps_history": 0,
            }
        )

    asks_total_percentage = round(
        (ask_volume_total / (ask_volume_total + bid_volume_total)) * 100
    )

    bids_total_percentage = round(
        (bid_volume_total / (ask_volume_total + bid_volume_total)) * 100
    )

    pulling_stacking(res)

    res_dict = {}
    for entry in res:
        res_dict[entry["price"]] = entry

    global prev_book
    prev_book = res_dict

    return {
        "data": res,
        "depth": depth,
        "ask_volume_total": ask_volume_total,
        "bid_volume_total": bid_volume_total,
        "ask_volume_total_percentage": asks_total_percentage,
        "bids_volume_total_percentage": bids_total_percentage,
        "pair": pair,
        "peg_price": peg_price,
        "price_decimals": book["price_decimals"],
        "qty_decimals": book["qty_decimals"],
        "valid": book["valid"],
        "checksum": checksum,
        "best_bid": best_bid,
        "best_ask": best_ask,
        "imbalance_history": imbalance_history,
        "large_volume_history": large_volume_history,
    }


class Orderbook(OrderbookClientV2):
    async def on_book_update(self, pair, message) -> None:
        book = self.get(pair=pair)
        book_ts = transform_book(
            book, depth=self.depth, pair=pair, checksum=message["data"][0]["checksum"]
        )
        if book_ts and order_book_websocket:
            await order_book_websocket.send_json(json.dumps(book_ts))


async def start_book(pairs, ws, depth=100) -> None:
    global order_book_websocket
    order_book_websocket = ws
    orderbook = Orderbook(depth=depth)
    print("created orderbook")

    await orderbook.add_book(
        pairs=pairs  # we can also subscribe to more currency pairs
    )

    while not orderbook.exception_occur:
        await asyncio.sleep(10)
