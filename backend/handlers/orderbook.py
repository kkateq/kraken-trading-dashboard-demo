from kraken.spot import OrderbookClientV2
import asyncio
import json

order_book_websocket = None


def transform_book(book, depth, pair):
    bids = [(float(i[0]), float(i[1][0])) for i in list(book["bid"].items())]
    asks = [(float(j[0]), float(j[1][0])) for j in list(book["ask"].items())]
    bid_volume = [round(j) for _, j in bids]
    ask_volume = [round(j) for _, j in asks]
    bid_price = [i for i, _ in bids]
    ask_price = [i for i, _ in asks]
    ask_volume.reverse()
    ask_price.reverse()

    bid_volume_total = round(sum(j for _, j in bids))
    ask_volume_total = round(sum(j for _, j in asks))

    order_book_depth = depth
    bids = [""] * order_book_depth + bid_volume
    price = ask_price + bid_price
    asks = ask_volume + [""] * order_book_depth
    res = []
    for bid, price, ask in zip(bids, price, asks):
        res.append({"bid": bid, "price": price, "ask": ask})

    asks_total_percentage = round(
        (ask_volume_total / (ask_volume_total + bid_volume_total)) * 100
    )

    bids_total_percentage = round(
        (bid_volume_total / (ask_volume_total + bid_volume_total)) * 100
    )

    return {
        "data": res,
        "depth": depth,
        "ask_volume_total": ask_volume_total,
        "bid_volume_total": bid_volume_total,
        "ask_volume_total_percentage": asks_total_percentage,
        "bids_volume_total_percentage": bids_total_percentage,
        "pair": pair,
    }


class Orderbook(OrderbookClientV2):
    async def on_book_update(self, pair, message) -> None:
        book = self.get(pair=pair)
        book_ts = transform_book(book, depth=self.depth, pair=pair)
        if book_ts and order_book_websocket:
            await order_book_websocket.send_json(json.dumps(book_ts))


async def start_book(pairs, ws, depth=25) -> None:
    global order_book_websocket
    order_book_websocket = ws
    orderbook = Orderbook(depth=depth)
    print("created orderbook")

    await orderbook.add_book(
        pairs=pairs  # we can also subscribe to more currency pairs
    )

    while not orderbook.exception_occur:
        await asyncio.sleep(10)
