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

ohlc_websocket = None

from kraken.exceptions import KrakenAuthenticationError  # , KrakenPermissionDeniedError
from kraken.spot import Funding, KrakenSpotWSClientV1, Market, Staking, Trade, User


class TradingBot(KrakenSpotWSClientV1):
    def __init__(self: TradingBot, config: dict) -> None:
        super().__init__(  # initialize the KrakenSpotWSClientV1
            key=config["key"],
            secret=config["secret"],
        )

    async def on_message(self: TradingBot, message: Union[dict, list]) -> None:
        """Receives all messages of the websocket connection(s)"""
        if isinstance(message, dict) and "event" in message:
            if message["event"] in {"heartbeat", "pong"}:
                return
            if "error" in message:
                # handle exceptions/errors sent by websocket connection …
                pass

        if isinstance(message, list):
            channelName = message[2]
            if channelName.startswith("ohlc"):
                await ohlc_websocket.send_json(json.dumps(message[1]))

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
        self.bot: Optional[TradingBot] = None

    async def run(self: Manager) -> None:
        """Starts the event loop and bot"""
        if not self.__check_credentials():
            logging.error("Invalid API credentials")
            sys.exit(1)

        try:
            self.bot = TradingBot(config=self.__config)
            interval = self.__config["interval"]
            pairs = self.__config["pairs"]
            # channel = "ohlc-{}".format(interval)
            await self.bot.subscribe(
                subscription={"name": "ohlc", "interval": int(interval)}, pair=pairs
            )
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
        if self.bot is not None:
            self.bot.save_exit(reason=reason)
        else:
            sys.exit(1)


async def start_ohlc(pair, ws, config, interval) -> None:
    global ohlc_websocket
    ohlc_websocket = ws
    manager: Manager = Manager(
        config={
            "key": config("SPOT_API_KEY", cast=str),
            "secret": config("SPOT_SECRET_KEY", cast=str),
            "pairs": [pair],
            "interval": interval,
        },
    )

    try:
        await manager.run()
    except Exception:
        manager.save_exit(
            reason=f"manageBot.run() has ended: {traceback.format_exc()}",
        )
