from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from data_fetcher import fetch_cryptocurrencies
from knn_analyzer import find_k_nearest

app = FastAPI(title="Crypto k-NN Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

crypto_data = []

FEATURE_MAP = {
    "use_market_cap": "market_cap",
    "use_volume": "volume",
    "use_price": "price",
    "use_price_change": "price_change_24h",
}


class FindSimilarRequest(BaseModel):
    crypto_id: str
    k: int = 5
    features: dict[str, bool]


@app.on_event("startup")
async def startup():
    global crypto_data
    try:
        crypto_data = fetch_cryptocurrencies()
        print(f"Załadowano {len(crypto_data)} kryptowalut.")
    except Exception as e:
        print(f"Błąd pobierania danych: {e}")


@app.get("/health")
async def health():
    return {"status": "ok", "count": len(crypto_data)}


@app.get("/cryptocurrencies")
async def get_cryptocurrencies():
    if not crypto_data:
        raise HTTPException(status_code=503, detail="Brak danych")
    return [{"id": c["id"], "symbol": c["symbol"], "name": c["name"]} for c in crypto_data]


@app.post("/find-similar")
async def find_similar(req: FindSimilarRequest):
    if not crypto_data:
        raise HTTPException(status_code=503, detail="Brak danych")

    cols = [FEATURE_MAP[f] for f, on in req.features.items() if on and f in FEATURE_MAP]

    try:
        results = find_k_nearest(crypto_data, req.crypto_id, req.k, cols)
        target = next((c for c in crypto_data if c["id"] == req.crypto_id), None)
        return {"target": target, "k": req.k, "results": results}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
