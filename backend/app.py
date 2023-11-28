import logging
import contextlib
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

logger = logging.getLogger(__name__)

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
