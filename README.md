# Crypto k-NN Analyzer

Aplikacja do wyszukiwania podobnych kryptowalut przy użyciu algorytmu k-NN.
Dane pobierane są z CoinGecko API.
Algorytm normalizuje wartości i wyszukuje k najbliższych sąsiadów po odległości euklidesowej.

## Uruchomienie

Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Struktura

```
backend/
  main.py           — API (FastAPI)
  knn_analyzer.py   — k-NN + normalizacja Min-Max
  data_fetcher.py   — CoinGecko API + cache

frontend/src/
  App.jsx           — UI
  App.css           — style
```

## API

| Metoda | Endpoint            | Opis                            |
|--------|--------------------|---------------------------------|
| GET    | `/health`          | Status serwera                  |
| GET    | `/cryptocurrencies`| Lista kryptowalut               |
| POST   | `/find-similar`    | Wyszukiwanie k podobnych krypto |
