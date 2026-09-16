import { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:8000';

function App() {
  const [cryptos, setCryptos] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [features, setFeatures] = useState({
    use_market_cap: true,
    use_volume: true,
    use_price: false,
    use_price_change: false,
  });
  const [k, setK] = useState(5);
  const [results, setResults] = useState([]);
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/cryptocurrencies`)
      .then((res) => res.json())
      .then((data) => setCryptos(data))
      .catch(() => setError('Nie udało się pobrać listy kryptowalut'));
  }, []);

  const handleSearch = async () => {
    if (!selectedCrypto) return;
    if (!Object.values(features).some(Boolean)) {
      setError('Wybierz przynajmniej jedną cechę');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/find-similar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crypto_id: selectedCrypto, k, features }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Błąd serwera');
      }
      const data = await res.json();
      setTarget(data.target);
      setResults(data.results);
    } catch (err) {
      setError(err.message);
      setTarget(null);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const featureLabels = {
    use_market_cap: 'Kapitalizacja rynkowa',
    use_volume: 'Wolumen (24h)',
    use_price: 'Cena',
    use_price_change: 'Zmiana ceny (24h)',
  };

  const formatNumber = (num) => {
    if (num == null) return '—';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const maxDist = results.length > 0
    ? Math.max(...results.map((r) => r.distance))
    : 0;

  return (
    <div className="app">
      <h1>Crypto k-NN Analyzer</h1>
      <p className="subtitle">
        Wyszukiwanie podobnych kryptowalut algorytmem k-Nearest Neighbors
      </p>

      <div className="controls">
        <div className="field">
          <label htmlFor="crypto-select">Kryptowaluta:</label>
          <select
            id="crypto-select"
            value={selectedCrypto}
            onChange={(e) => setSelectedCrypto(e.target.value)}
          >
            <option value="">-- Wybierz --</option>
            {cryptos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.symbol.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <fieldset className="field">
          <legend>Cechy do analizy:</legend>
          <div className="checkboxes">
            {Object.entries(featureLabels).map(([key, label]) => (
              <label key={key} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={features[key]}
                  onChange={(e) =>
                    setFeatures((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="k-input">Liczba sąsiadów (k):</label>
          <input
            id="k-input"
            type="number"
            min="1"
            max="20"
            value={k}
            onChange={(e) => setK(parseInt(e.target.value) || 5)}
          />
        </div>

        <button onClick={handleSearch} disabled={loading || !selectedCrypto}>
          {loading ? 'Szukam...' : 'Znajdź podobne'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {target && (
        <div className="target-card">
          <h2>Sprawdzana kryptowaluta</h2>
          <div className="target-name">
            {target.name} ({target.symbol.toUpperCase()})
          </div>
          <div className="target-stats">
            <div className="stat">
              <span className="stat-label">Kapitalizacja</span>
              <span className="stat-value">{formatNumber(target.market_cap)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Wolumen 24h</span>
              <span className="stat-value">{formatNumber(target.volume)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Cena</span>
              <span className="stat-value">{formatNumber(target.price)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Zmiana 24h</span>
              <span className={`stat-value ${target.price_change_24h >= 0 ? 'positive' : 'negative'}`}>
                {target.price_change_24h != null ? `${target.price_change_24h.toFixed(2)}%` : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="chart-section">
          <h2>Odległość euklidesowa</h2>
          <p className="chart-hint">Im krótszy słupek, tym bardziej podobna kryptowaluta</p>
          <div className="bar-chart">
            {results.map((r) => (
              <div key={r.id} className="bar-row">
                <span className="bar-label">{r.symbol.toUpperCase()}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${maxDist > 0 ? (r.distance / maxDist) * 100 : 0}%` }}
                  />
                </div>
                <span className="bar-value">{r.distance.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="results">
          <h2>Najbliżsi sąsiedzi (k={k})</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nazwa</th>
                <th>Symbol</th>
                <th>Odległość</th>
                <th>Kapitalizacja</th>
                <th>Wolumen</th>
                <th>Cena</th>
                <th>Zmiana 24h</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td>{r.rank}</td>
                  <td>{r.name}</td>
                  <td>{r.symbol.toUpperCase()}</td>
                  <td>{r.distance.toFixed(4)}</td>
                  <td>{formatNumber(r.market_cap)}</td>
                  <td>{formatNumber(r.volume)}</td>
                  <td>{formatNumber(r.price)}</td>
                  <td className={r.price_change_24h >= 0 ? 'positive' : 'negative'}>
                    {r.price_change_24h != null ? `${r.price_change_24h.toFixed(2)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
