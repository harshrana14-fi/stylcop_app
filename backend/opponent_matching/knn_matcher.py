"""
KNN-based opponent matching for outfit battle page.
Matches users by gender, age (normalized), and style preference (one-hot) with feature weighting.
"""

import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from typing import List, Optional, Tuple

# ---------------------------------------------------------------------------
# Constants: align with onboarding FASHION_PREFERENCES (order must be fixed)
# ---------------------------------------------------------------------------
STYLE_OPTIONS = [
    "Streetwear", "Minimalist", "Vintage", "Sporty", "Techwear",
    "Bohemian", "Classic", "Casual", "Formal", "Preppy", "Grunge",
    "Y2K", "Coastal", "Urban", "High Fashion", "Athleisure",
    "Romantic", "Edgy", "Artsy", "Sustainable",
]

# Gender encoding: Male=0, Female=1, Other=2 (matches onboarding keys)
GENDER_MAP = {"male": 0, "female": 1, "other": 2}

# Feature weights: style preference >> gender, age (so style drives matching more)
WEIGHT_GENDER = 0.5
WEIGHT_AGE = 0.5
WEIGHT_STYLE = 2.0  # higher = style has more importance in Euclidean distance


def prepare_features(users_df: pd.DataFrame) -> Tuple[pd.DataFrame, np.ndarray, List[str]]:
    """
    Prepare feature matrix from raw user data.
    - Encodes gender (0/1/2), normalizes age (age/100), one-hot encodes styles.
    - Returns (feature_df, weighted_matrix, style_column_names).
    """
    # 1) Encode gender
    gender_encoded = users_df["gender"].str.lower().map(GENDER_MAP)
    if gender_encoded.isna().any():
        gender_encoded = gender_encoded.fillna(GENDER_MAP["other"])
    users_df = users_df.copy()
    users_df["gender_enc"] = gender_encoded.astype(int)

    # 2) Normalize age: divide by 100, clip to [0, 1] for sanity
    users_df["age_norm"] = (users_df["age"] / 100.0).clip(0.0, 1.0)

    # 3) One-hot encode style preference (styles users chose in onboarding)
    style_columns = [f"style_{s}" for s in STYLE_OPTIONS]
    for col in style_columns:
        users_df[col] = 0

    for idx, row in users_df.iterrows():
        prefs = row.get("preferences") or []
        for p in prefs:
            # Match case-insensitively to STYLE_OPTIONS
            pnorm = str(p).strip()
            for style_name in STYLE_OPTIONS:
                if style_name.lower() == pnorm.lower():
                    users_df.at[idx, f"style_{style_name}"] = 1
                    break

    # 4) Build numeric feature matrix: [gender_enc, age_norm, ...style_one_hot...]
    feature_cols = ["gender_enc", "age_norm"] + style_columns
    X = users_df[feature_cols].values.astype(np.float64)

    # 5) Apply feature weighting so Euclidean distance reflects importance
    #    Scale each dimension: weighted Euclidean = Euclidean on scaled features
    weights = np.array(
        [WEIGHT_GENDER, WEIGHT_AGE] + [WEIGHT_STYLE] * len(style_columns),
        dtype=np.float64,
    )
    X_weighted = X * weights

    return users_df, X_weighted, feature_cols


def build_knn_model(X_weighted: np.ndarray, metric: str = "euclidean") -> NearestNeighbors:
    """
    Build and fit a KNN model using (weighted) Euclidean distance.
    """
    # Request up to n neighbors so match_opponents can ask for k+1 (self + k others)
    n = X_weighted.shape[0]
    n_neighbors = max(1, n)
    model = NearestNeighbors(
        n_neighbors=n_neighbors,
        algorithm="auto",
        metric=metric,
    )
    # Note: kneighbors() can request fewer neighbors when querying
    model.fit(X_weighted)
    return model


def match_opponents(
    user_id: str,
    k: int,
    users_df: pd.DataFrame,
    X_weighted: np.ndarray,
    knn_model: NearestNeighbors,
    id_column: str = "user_id",
) -> List[str]:
    """
    Return top K nearest opponent user_ids for the given user_id, excluding the current user.
    Uses Euclidean distance on weighted features (gender, age, style one-hot).
    """
    if users_df.empty or k <= 0:
        return []

    # Find row index for current user
    mask = users_df[id_column].astype(str) == str(user_id)
    if not mask.any():
        return []

    current_idx = users_df.index[mask].item()
    row_pos = users_df.index.get_loc(current_idx)
    if isinstance(row_pos, np.ndarray):
        row_pos = int(row_pos[0])
    else:
        row_pos = int(row_pos)

    # Query for k+1 neighbors (first is self)
    n_neighbors_request = min(k + 1, X_weighted.shape[0])
    distances, indices = knn_model.kneighbors(
        X_weighted[row_pos : row_pos + 1],
        n_neighbors=n_neighbors_request,
        return_distance=True,
    )
    distances = distances[0]
    indices = indices[0]

    # Exclude self and collect opponent ids (up to k)
    opponent_ids: List[str] = []
    for d, idx in zip(distances, indices):
        if idx == row_pos:
            continue
        uid = users_df.iloc[idx][id_column]
        opponent_ids.append(str(uid))
        if len(opponent_ids) >= k:
            break

    return opponent_ids


# ---------------------------------------------------------------------------
# Mock dataset and sample usage
# ---------------------------------------------------------------------------
def get_mock_users() -> pd.DataFrame:
    """Small mock user dataset for testing opponent matching."""
    return pd.DataFrame([
        {
            "user_id": "u1",
            "gender": "female",
            "age": 22,
            "preferences": ["Streetwear", "Minimalist", "Y2K"],
        },
        {
            "user_id": "u2",
            "gender": "female",
            "age": 24,
            "preferences": ["Streetwear", "Minimalist", "Casual"],
        },
        {
            "user_id": "u3",
            "gender": "male",
            "age": 20,
            "preferences": ["Sporty", "Athleisure", "Casual"],
        },
        {
            "user_id": "u4",
            "gender": "male",
            "age": 21,
            "preferences": ["Vintage", "Classic", "Formal"],
        },
        {
            "user_id": "u5",
            "gender": "female",
            "age": 23,
            "preferences": ["Streetwear", "Y2K", "Edgy"],
        },
        {
            "user_id": "u6",
            "gender": "other",
            "age": 25,
            "preferences": ["Minimalist", "Sustainable", "Artsy"],
        },
    ])


def run_sample():
    """Sample: prepare data, fit KNN, and get top K opponents for a user."""
    users_df = get_mock_users()
    users_df, X_weighted, feature_cols = prepare_features(users_df)
    knn_model = build_knn_model(X_weighted, metric="euclidean")
    opponents = match_opponents("u1", k=3, users_df=users_df, X_weighted=X_weighted, knn_model=knn_model)
    print("Top 3 opponents for u1:", opponents)
    return opponents


if __name__ == "__main__":
    run_sample()
