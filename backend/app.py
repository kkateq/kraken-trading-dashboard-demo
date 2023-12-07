import logging
import contextlib
import json
from starlette.applications import Starlette
from starlette.endpoints import WebSocketEndpoint
from datetime import datetime
from starlette.routing import Route, WebSocketRoute
from starlette.middleware import Middleware
from starlette.websockets import WebSocket
from starlette.templating import Jinja2Templates
from handlers.orderbook import start_book
from handlers.orders import start_orders
from handlers.trades import start_trades
from handlers.ohlc import start_ohlc
from handlers.spread import start_spread
from handlers.manager import get_kraken_manager
import uvicorn
from starlette.config import Config
from starlette.schemas import SchemaGenerator
from starlette.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

templates = Jinja2Templates("templates")
config = Config(".env")
schemas = SchemaGenerator(
    {"openapi": "3.0.0", "info": {"title": "Alpha API", "version": "1.0"}}
)

pairs = ["MATIC/USD"]

kraken_manager = None


async def homepage(request):
    template = "index.html"
    context = {"request": request}
    return templates.TemplateResponse(template, context)


class OrderBookWebsocketEndpoint(WebSocketEndpoint):
    encoding = "json"

    async def on_connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        await start_book(pairs, websocket)


class OrdersWebsocketEndpoint(WebSocketEndpoint):
    encoding = "json"

    async def on_connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        await start_orders(pairs, websocket, config)


class OHLCWebsocketEndpoint(WebSocketEndpoint):
    encoding = "json"

    async def on_connect(self, websocket: WebSocket) -> None:
        pair = websocket.query_params["pair"]
        interval = websocket.query_params["interval"]
        await websocket.accept()
        await start_ohlc(pair, websocket, config, interval)


class TradesWebsocketEndpoint(WebSocketEndpoint):
    encoding = "json"

    async def on_connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        await start_trades(pairs, websocket, config)


class SpreadWebsocketEndpoint(WebSocketEndpoint):
    encoding = "json"

    async def on_connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        await start_spread(pairs, websocket, config)


class OperateWebsocketEndpoint(WebSocketEndpoint):
    encoding = "json"

    async def add_order(self, data) -> None:
        ordertype = data["ordertype"] if "ordertype" in data else None
        side = data["side"] if "side" in data else None
        pair = data["pair"] if "pair" in data else None
        volume = data["volume"] if "volume" in data else None
        price = data["price"] if "price" in data else None
        leverage = data["leverage"] if "leverage" in data else None
        reduce_only = data["reduce_only"] if "reduce_only" in data else None
        if all(v is not None for v in [ordertype, side, pair, volume, price, leverage]):
            res = kraken_manager.bot.add_order(
                ordertype, side, pair, price, volume, leverage, reduce_only
            )
            return JSONResponse(res)
        else:
            logging.error("Not all arguments specified for order creation.")

    async def cancel_order(self, data) -> None:
        txid = data["id"] if "id" in data else None

        if txid:
            res = kraken_manager.bot.cancel_pending_order(txid)
            return JSONResponse(res)
        else:
            logging.error("Not all arguments specified for order creation.")

    async def cancel_all_pending_orders(self) -> None:
        res = kraken_manager.bot.cancel_all_pending_orders()
        return JSONResponse(res)

    async def on_connect(self, websocket: WebSocket) -> None:
        await websocket.accept()

    async def parse_and_send_response(self, websocket, res, operation):
        if res:
            body = json.loads(res.body)
            await websocket.send_json(body)
        else:
            logger.warning("No response received after {} execution".format(operation))

    async def on_receive(self, websocket: WebSocket, data) -> None:
        if kraken_manager:
            operation = data["operation"]
            if operation:
                logging.info("Operation {} executed.".format(operation))
                match operation:
                    case "add_order":
                        res = await self.add_order(data)
                        await self.parse_and_send_response(websocket, res, operation)
                        return

                    case "cancel_pending_order":
                        res = await self.cancel_order(data)
                        await self.parse_and_send_response(websocket, res, operation)
                        return

                    case "cancel_all_pending_orders":
                        res = await self.cancel_all_pending_orders()
                        await self.parse_and_send_response(websocket, res, operation)
                        return


def openapi_schema(request):
    return schemas.OpenAPIResponse(request=request)


@contextlib.asynccontextmanager
async def lifespan(app):
    global kraken_manager
    kraken_manager = await get_kraken_manager(pairs=pairs, config=config)
    yield
    await kraken_manager.save_exit()


async def list_orders(request):
    global kraken_manager
    if kraken_manager and kraken_manager.bot:
        orders = kraken_manager.bot.get_open_orders()
        return JSONResponse(orders)
    else:
        logger.error("kraken_manager is not available")
        return JSONResponse([])


async def list_positions(request):
    global kraken_manager
    if kraken_manager and kraken_manager.bot:
        positions = kraken_manager.bot.get_open_positions()
        return JSONResponse(positions)
    else:
        logger.error("kraken_manager is not available")
        return JSONResponse([])


def transform_ohlc_apex_charts(data, pair):
    ohlc = []
    time_vwap = []
    time_trades_count = []
    time_volumes = []

    pair_ohlc = data[pair]
    for [time, openp, high, low, close, vwap, volume, count] in pair_ohlc:
        ohlc.append({"x": time, "y": [openp, high, low, close]})
        time_volumes.append({"x": time, "y": volume})
        time_trades_count.append({"x": time, "y": count})
        time_vwap.append({"x": time, "y": vwap})

    return {
        "candlestick": ohlc,
        "volume": time_volumes,
        "trade_count": time_trades_count,
        "vwap": time_vwap,
    }


def transform_ohlc_tradingview(data, pair):
    ohlc = []
    time_vwap = []
    time_trades_count = []
    time_volumes = []

    pair_ohlc = data[pair]
    for [time, openp, high, low, close, vwap, volume, count] in pair_ohlc:
        ohlc.append(
            {
                "time": time,
                "open": float(openp),
                "high": float(high),
                "low": float(low),
                "close": float(close),
            }
        )
        time_volumes.append({"time": time, "value": float(volume)})
        time_trades_count.append({"time": time, "value": float(count)})
        time_vwap.append({"time": time, "value": float(vwap)})

    return {
        "candlestick": ohlc,
        "volume": time_volumes,
        "trade_count": time_trades_count,
        "vwap": time_vwap,
    }


async def list_ohlc(request):
    global kraken_manager
    if kraken_manager and kraken_manager.bot:
        pair = request.query_params["pair"]
        interval = request.query_params["interval"]
        if pair and interval:
            ohlc_data = kraken_manager.bot.get_ohlc(pair, interval)

            ohlc_data_transformed = transform_ohlc_tradingview(ohlc_data, pair)

            return JSONResponse(ohlc_data_transformed)
        else:
            logger.error("Pair and interval parameters should be provided.")
    else:
        logger.error("kraken_manager is not available")
        return JSONResponse([])


if __name__ == "__main__":
    app = Starlette(
        routes=(
            Route("/", homepage, name="hello"),
            WebSocketRoute("/ws_orderbook", OrderBookWebsocketEndpoint),
            WebSocketRoute("/ws_orders", OrdersWebsocketEndpoint),
            WebSocketRoute("/ws_trades", TradesWebsocketEndpoint),
            WebSocketRoute("/ws_create", OperateWebsocketEndpoint),
            WebSocketRoute("/ws_ohlc", OHLCWebsocketEndpoint),
            WebSocketRoute("/ws_spread", SpreadWebsocketEndpoint),
            Route("/orders", endpoint=list_orders, methods=["GET"]),
            Route("/positions", endpoint=list_positions, methods=["GET"]),
            Route("/ohlc", endpoint=list_ohlc, methods=["GET"]),
            Route("/schema", endpoint=openapi_schema, include_in_schema=False),
        ),
        middleware=[Middleware(CORSMiddleware, allow_origins=["*"])],
        lifespan=lifespan,
        debug=True,
    )

    uvicorn.run(app, host="0.0.0.0", port=8000)


# app = Starlette(
#     routes=(
#         Route("/", homepage, name="hello"),
#         WebSocketRoute("/ws_orderbook", OrderBookWebsocketEndpoint),
#         Route("/orders", endpoint=list_orders, methods=["GET"]),
#         Route("/schema", endpoint=openapi_schema, include_in_schema=False),
#     ),
#     debug=True,
# )

# app.add_middleware(
#     CORSMiddleware, allow_origins=["*"], allow_headers=["*"], allow_methods=["*"]
# )
