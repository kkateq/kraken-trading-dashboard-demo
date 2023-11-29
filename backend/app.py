import logging
import contextlib
import json
from starlette.applications import Starlette
from starlette.endpoints import WebSocketEndpoint

from starlette.routing import Route, WebSocketRoute

from starlette.websockets import WebSocket
from starlette.templating import Jinja2Templates
from handlers.orderbook import start_book
from handlers.orders import start_orders
from handlers.trades import start_trades
from handlers.manager import get_kraken_manager
import uvicorn
from starlette.config import Config
from starlette.schemas import SchemaGenerator
from starlette.responses import JSONResponse

import asyncio

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


class TradesWebsocketEndpoint(WebSocketEndpoint):
    encoding = "json"

    async def on_connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        await start_trades(pairs, websocket, config)


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

    async def on_connect(self, websocket: WebSocket) -> None:
        await websocket.accept()

    async def on_receive(self, websocket: WebSocket, data) -> None:
        if kraken_manager:
            operation = data["operation"]
            if operation and operation == "add_order":
                logging.info("Operation add_order executed.")
                res = await self.add_order(data)
                if res:
                    body = json.loads(res.body)
                    await websocket.send_json(body)
                else:
                    logger.warning(
                        "No response received after {} execution".format(operation)
                    )


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
    if kraken_manager:
        orders = kraken_manager.bot.get_open_orders()
        return JSONResponse(orders)
    else:
        print("kraken_manager is not available")
        return JSONResponse([])


async def list_positions(request):
    global kraken_manager
    if kraken_manager:
        positions = kraken_manager.bot.get_open_positions()
        return JSONResponse(positions)
    else:
        print("kraken_manager is not available")
        return JSONResponse([])


if __name__ == "__main__":
    app = Starlette(
        routes=(
            Route("/", homepage, name="hello"),
            WebSocketRoute("/ws_orderbook", OrderBookWebsocketEndpoint),
            WebSocketRoute("/ws_orders", OrdersWebsocketEndpoint),
            WebSocketRoute("/ws_trades", OrdersWebsocketEndpoint),
            WebSocketRoute("/ws_create", OperateWebsocketEndpoint),
            Route("/orders", endpoint=list_orders, methods=["GET"]),
            Route("/positions", endpoint=list_positions, methods=["GET"]),
            Route("/schema", endpoint=openapi_schema, include_in_schema=False),
        ),
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
