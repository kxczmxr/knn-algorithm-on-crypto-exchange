import math


def min_max_normalize(data, columns):
    mins = {}
    maxs = {}
    for col in columns:
        vals = [row[col] for row in data if row[col] is not None]
        mins[col] = min(vals) if vals else 0
        maxs[col] = max(vals) if vals else 0

    normalized = []
    for row in data:
        norm = {}
        for col in columns:
            v = row[col]
            if v is None or maxs[col] == mins[col]:
                norm[col] = 0.0
            else:
                norm[col] = (v - mins[col]) / (maxs[col] - mins[col])
        normalized.append(norm)

    return normalized


def euclidean_distance(a, b, columns):
    return math.sqrt(sum((a[c] - b[c]) ** 2 for c in columns))


def find_k_nearest(data, target_id, k, selected_columns):
    if not selected_columns:
        raise ValueError("Musisz wybrać przynajmniej jedną cechę do analizy.")

    valid = [row for row in data if all(row.get(c) is not None for c in selected_columns)]

    target_idx = None
    for i, row in enumerate(valid):
        if row["id"] == target_id:
            target_idx = i
            break

    if target_idx is None:
        raise ValueError(f"Kryptowaluta '{target_id}' nie znaleziona lub ma brakujące dane.")

    normalized = min_max_normalize(valid, selected_columns)

    distances = []
    for i, norm_row in enumerate(normalized):
        if i == target_idx:
            continue
        dist = euclidean_distance(normalized[target_idx], norm_row, selected_columns)
        distances.append((i, dist))

    distances.sort(key=lambda x: x[1])

    results = []
    for rank, (idx, dist) in enumerate(distances[:k], 1):
        row = valid[idx]
        results.append({
            "id": row["id"],
            "symbol": row["symbol"],
            "name": row["name"],
            "distance": round(dist, 6),
            "rank": rank,
            "market_cap": row.get("market_cap"),
            "volume": row.get("volume"),
            "price": row.get("price"),
            "price_change_24h": row.get("price_change_24h"),
        })

    return results