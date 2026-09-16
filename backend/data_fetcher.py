import requests
import time

_cache = {"data": None, "timestamp": 0}
CACHE_DURATION = 3600


def fetch_cryptocurrencies():
    if _cache["data"] and time.time() - _cache["timestamp"] < CACHE_DURATION:
        return _cache["data"]

    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": "usd",
        "order": "market_cap_desc",
        "per_page": 100,
        "page": 1,
        "sparkline": "false",
    }

    resp = requests.get(url, params=params, timeout=15)
    resp.raise_for_status()
    raw = resp.json()

    cryptos = []
    for coin in raw:
        cryptos.append({
            "id": coin["id"],
            "symbol": coin["symbol"],
            "name": coin["name"],
            "market_cap": coin.get("market_cap"),
            "volume": coin.get("total_volume"),
            "price": coin.get("current_price"),
            "price_change_24h": coin.get("price_change_percentage_24h"),
        })

    cryptos = [c for c in cryptos if c["market_cap"] and c["volume"] and c["price"]]

    _cache["data"] = cryptos
    _cache["timestamp"] = time.time()

    return cryptos
