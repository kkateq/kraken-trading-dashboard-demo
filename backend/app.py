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
from handlers.token import get_token
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


async def get_kraken_token(request):
    return JSONResponse(get_token(config))


if __name__ == "__main__":
    app = Starlette(
        routes=(
            Route("/", homepage, name="hello"),
            Route("/orders", endpoint=list_orders, methods=["GET"]),
            Route("/positions", endpoint=list_positions, methods=["GET"]),
            Route("/ohlc", endpoint=list_ohlc, methods=["GET"]),
            Route("/schema", endpoint=openapi_schema, include_in_schema=False),
            Route("/token", endpoint=get_kraken_token, methods=["GET"]),
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
