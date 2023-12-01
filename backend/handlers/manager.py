from __future__ import annotations

import asyncio
import json
import logging
import logging.config

import sys
import traceback
from typing import Optional, Union
from enum import Enum
import requests
import urllib3


from kraken.exceptions import KrakenAuthenticationError  # , KrakenPermissionDeniedError
from kraken.spot import KrakenSpotWSClientV1, Market, Trade, User


class BotStatus(Enum):
    CLOSED = 0
    ONLINE = 1
    ERROR = 2


class TradingBot(KrakenSpotWSClientV1):
    def __init__(self: TradingBot, config: dict) -> None:
        super().__init__(
            key=config["key"],
            secret=config["secret"],
        )
        # self.__config: dict = config

        self.__user: User = User(key=config["key"], secret=config["secret"])
        self.__trade: Trade = Trade(key=config["key"], secret=config["secret"])
        self.__market: Market = Market(key=config["key"], secret=config["secret"])

    def get_open_positions(self):
        open_positions = self.__user.get_open_positions()
        return open_positions

    def get_open_orders(self):
        open_orders = self.__user.get_open_orders()
        if "open" in open_orders:
            return json.dumps(open_orders["open"])
        return json.dumps(open_orders)

    def cancel_pending_order(self, txid):
        return self.__trade.cancel_order(txid)

    def cancel_all_pending_orders(self):
        return self.__trade.cancel_all_orders()

    def close_position(self, value, flat=False, market=False):
        if flat:
            logging.info("[bold]Flattening...")
        pair = value["pair"]
        current_position_side = value["type"]
        new_position_side = "sell" if current_position_side == "buy" else "buy"
        if market:
            # NOTE: this was not tested yet!
            res = self.__trade.create_order(
                ordertype="market",
                side=new_position_side,
                pair=pair,
                volume=float(value["vol"]),
                leverage=leverage,
                reduce_only=True,
                validate=True,
            )
            logging.info(
                "[bold]Sending market {} order for pair {} ...[/bold]".format(
                    new_position_side, pair
                )
            )
            return res
        ticker = self.__market.get_ticker(pair=pair)

        if pair in ticker:
            logging.info("[bold]Got the current bid/ask for {}[/bold]".format(pair))
            best_bid = ticker[pair]["b"][0]
            best_ask = ticker[pair]["a"][0]
            price = (
                float(best_bid if new_position_side == "sell" else best_ask)
                if flat
                else float(best_ask if new_position_side == "sell" else best_bid)
            )

            logging.info(
                "[bold]Sending {} order for pair {} with price {} ...[/bold]".format(
                    new_position_side, pair, price
                )
            )

            leverage = int(float(value["leverage"]))

            res = self.__trade.create_order(
                ordertype="limit",
                side=new_position_side,
                pair=pair,
                volume=float(value["vol"]),
                price=price,
                leverage=leverage,
                reduce_only=True,
                # validate=True,
            )

            if res and "txid" in res:
                logging.info(
                    "[bold]Order {} to {} pair {} at price {} has been created.[/bold]".format(
                        res["txid"], new_position_side, pair, price
                    )
                )
            else:
                logging.info("[bold red] Error during order creation.[/bold red]")
                logging.info(res)
            return res

    def add_order(self, ordertype, side, pair, price, volume, leverage, reduce_only):
        logging.info("Adding order...")
        return self.__trade.create_order(
            ordertype=ordertype,
            side=side,
            pair=pair,
            volume=volume,
            price=price,
            leverage=leverage,
            reduce_only=reduce_only,
            # validate=True,
        )

    async def on_message(self: TradingBot, message: Union[dict, list]) -> None:
        """Receives all messages of the websocket connection(s)"""
        if isinstance(message, dict) and "event" in message:
            if message["event"] in {"heartbeat", "pong"}:
                return
            if "error" in message:
                # handle exceptions/errors sent by websocket connection …
                self.__status = BotStatus.ERROR
                logging.error(message)
            if "status" in message and message["status"] == "online":
                self.__status = BotStatus.ONLINE

        logging.info(message)

    def save_exit(self: TradingBot, reason: Optional[str] = "") -> None:
        """controlled shutdown of the strategy"""
        logging.warning(
            "Save exit triggered, reason: {reason}",
            extra={"reason": reason},
        )

        sys.exit(1)

    def get_status(
        self: TradingBot,
    ):
        return self.__status


class Manager:
    def __init__(self: Manager, config: dict):
        self.__config: dict = config
        self.bot: Optional[TradingBot] = None

    async def run(self: Manager) -> None:
        if not self.__check_credentials():
            sys.exit(1)

        try:
            self.bot = TradingBot(config=self.__config)
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
        if self.bot is not None:
            self.bot.save_exit(reason=reason)


async def get_kraken_manager(pairs, config) -> Manager:
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
        logging.exception(traceback.format_exc())
        manager.save_exit(
            reason=f"manageBot.run() has ended: {traceback.format_exc()}",
        )
    return manager
