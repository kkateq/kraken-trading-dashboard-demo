from __future__ import annotations

import sys
import traceback
from typing import Optional, Union

import requests
import urllib3
import logging
import logging.config
import asyncio
import json

orders_websocket = None

from kraken.exceptions import KrakenAuthenticationError  # , KrakenPermissionDeniedError
from kraken.spot import Funding, KrakenSpotWSClientV1, Market, Staking, Trade, User


class TradingBot(KrakenSpotWSClientV1):
    """
    Class that implements the trading strategy

    * The on_message function gets all messages sent by the websocket feeds.
    * Decisions can be made based on these messages
    * Can place trades using the self.__trade client or self.send_message
    * Do everything you want

    ====== P A R A M E T E R S ======
    config: dict
        configuration like: {
            "key": "kraken-spot-key",
            "secret": "kraken-spot-secret",
            "pairs": ["DOT/USD", "BTC/USD"],
        }
    """

    def __init__(self: TradingBot, config: dict) -> None:
        super().__init__(  # initialize the KrakenSpotWSClientV1
            key=config["key"],
            secret=config["secret"],
        )
        self.__config: dict = config

        self.__user: User = User(key=config["key"], secret=config["secret"])

    async def on_message(self: TradingBot, message: Union[dict, list]) -> None:
        """Receives all messages of the websocket connection(s)"""
        if isinstance(message, dict) and "event" in message:
            if message["event"] in {"heartbeat", "pong"}:
                return
            if "error" in message:
                # handle exceptions/errors sent by websocket connection …
                pass

        # logging.info(message)

        if isinstance(message, list):
            orders = message[0]
            channel = message[1]
            if channel == "openOrders":
                await orders_websocket.send_json(json.dumps(orders))

    def save_exit(self: TradingBot, reason: Optional[str] = "") -> None:
        """controlled shutdown of the strategy"""
        logging.warning(
            "Save exit triggered, reason: {reason}",
            extra={"reason": reason},
        )

        sys.exit(1)


class Manager:
    def __init__(self: Manager, config: dict):
        self.__config: dict = config
        self.__trading_strategy: Optional[TradingBot] = None

    async def run(self: Manager) -> None:
        """Starts the event loop and bot"""
        if not self.__check_credentials():
            logging.error("Invalid API credentials")
            sys.exit(1)

        try:
            self.__trading_strategy = TradingBot(config=self.__config)
            await self.__trading_strategy.subscribe(subscription={"name": "openOrders"})
        except KeyboardInterrupt:
            self.save_exit(reason="KeyboardInterrupt")

    def __check_credentials(self: Manager) -> bool:
        """Checks the user credentials and the connection to Kraken"""
        try:
            User(self.__config["key"], self.__config["secret"]).get_account_balance()
            logging.info("Client credentials are valid.")
            return True
        except urllib3.exceptions.MaxRetryError:
            logging.error("MaxRetryError, cannot connect.")
            return False
        except requests.exceptions.ConnectionError:
            logging.error("ConnectionError, Kraken not available.")
            return False
        except KrakenAuthenticationError:
            logging.error("Invalid credentials!")
            return False

    def save_exit(self: Manager, reason: str = "") -> None:
        """Invoke the save exit function of the trading strategy"""
        print(f"Save exit triggered - {reason}")
        if self.__trading_strategy is not None:
            self.__trading_strategy.save_exit(reason=reason)
        else:
            sys.exit(1)


async def start_orders(pairs, ws, config) -> None:
    global orders_websocket
    orders_websocket = ws
    manager: Manager = Manager(
        config={
            "key": config("SPOT_API_KEY", cast=str),
            "secret": config("SPOT_SECRET_KEY", cast=str),
            "pairs": pairs,
        },
    )

    try:
        await manager.run()
    except Exception:
        manager.save_exit(
            reason=f"manageBot.run() has ended: {traceback.format_exc()}",
        )
