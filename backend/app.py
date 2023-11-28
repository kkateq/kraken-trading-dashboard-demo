import logging

from starlette.applications import Starlette
from starlette.endpoints import WebSocketEndpoint

from starlette.routing import Route, WebSocketRoute

from starlette.websockets import WebSocket
from starlette.templating import Jinja2Templates
from handlers.orderbook import start_book
from handlers.orders import start_orders
import uvicorn
from starlette.config import Config

# from starlette.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)

templates = Jinja2Templates("templates")
config = Config(".env")


pairs = ["MATIC/USD"]


async def homepage(request):
    template = "index.html"
    context = {"request": request}
    return templates.TemplateResponse(template, context)


class OrderBookWebsocketEndpoint(WebSocketEndpoint):
    encoding = "json"

    async def on_connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        await start_book(pairs, websocket)

    # async def on_receive(self, websocket, data):
    #     await websocket.send_text(f"Message text was: {data}")


class OrdersWebsocketEndpoint(WebSocketEndpoint):
    encoding = "json"

    async def on_connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        await start_orders(pairs, websocket, config)

    # async def on_receive(self, websocket, data):
    #     await websocket.send_text(f"Message text was: {data}")


# if __name__ == "__main__":
#     start_book(None, 10)
#     app = Starlette(
#         routes=(
#             Route("/", homepage, name="hello"),
#             WebSocketRoute("/ws_orderbook", OrderBookWebsocketEndpoint),
#         ),
#     )

#     uvicorn.run(app, host="0.0.0.0", port=8000)


app = Starlette(
    routes=(
        Route("/", homepage, name="hello"),
        WebSocketRoute("/ws_orderbook", OrderBookWebsocketEndpoint),
        WebSocketRoute("/ws_orders", OrdersWebsocketEndpoint),
    ),
    debug=True,
)

# app.add_middleware(
#     CORSMiddleware, allow_origins=["*"], allow_headers=["*"], allow_methods=["*"]
# )
