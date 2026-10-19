
from pathlib import Path
from functools import lru_cache

import pandas as pd
from fastapi import FastAPI, HTTPException, Query


# --------------------------------------------------
# 1. Project paths
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]

SIMILARITY_FILE = (
    PROJECT_ROOT / "ml" / "artifacts" / "item_similarity_topk.csv"
)

POPULARITY_FILE = (
    PROJECT_ROOT / "ml" / "artifacts" / "popularity_ranking.csv"
)

TRAIN_FILE = (
    PROJECT_ROOT / "data" / "processed" / "train.csv.gz"
)


# --------------------------------------------------
# 2. Initialize FastAPI BEFORE declaring endpoints
# --------------------------------------------------

app = FastAPI(
    title="Large-Scale Personalized Recommendation Engine",
    description=(
        "Movie recommendation API using popularity ranking "
        "and item-based collaborative filtering"
    ),
    version="1.0.0",
)


# --------------------------------------------------
# 3. Load recommendation artifacts
# --------------------------------------------------

for file_path in [SIMILARITY_FILE, POPULARITY_FILE]:
    if not file_path.exists():
        raise FileNotFoundError(
            f"Required recommendation artifact not found: {file_path}"
        )

similarity_df = pd.read_csv(SIMILARITY_FILE)
popularity_df = pd.read_csv(POPULARITY_FILE)

similarity_df["movieId"] = similarity_df["movieId"].astype(int)
similarity_df["similarMovieId"] = (
    similarity_df["similarMovieId"].astype(int)
)
popularity_df["movieId"] = popularity_df["movieId"].astype(int)

movie_info = popularity_df.set_index("movieId").to_dict("index")


# --------------------------------------------------
# 4. Load training ratings once, on first user request
# --------------------------------------------------

@lru_cache(maxsize=1)
def load_user_histories():
    if not TRAIN_FILE.exists():
        raise FileNotFoundError(
            f"Training data not found: {TRAIN_FILE}"
        )

    return pd.read_csv(
        TRAIN_FILE,
        usecols=["userId", "movieId", "rating"],
        dtype={
            "userId": "int32",
            "movieId": "int32",
            "rating": "float32",
        },
    )


# --------------------------------------------------
# 5. Basic endpoints
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "project": "Large-Scale Personalized Recommendation Engine",
        "status": "running",
        "message": "Recommendation API is ready",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "similarity_artifact_loaded": not similarity_df.empty,
        "movie_catalog_loaded": not popularity_df.empty,
        "training_data_exists": TRAIN_FILE.exists(),
    }


# --------------------------------------------------
# 6. Similar movies for a given movie
# --------------------------------------------------

@app.get("/recommendations/movie/{movie_id}")
def recommend_similar_movies(
    movie_id: int,
    limit: int = Query(default=10, ge=1, le=50),
):
    if movie_id not in movie_info:
        raise HTTPException(
            status_code=404,
            detail="Movie not found in the recommendation catalog",
        )

    matches = similarity_df[
        similarity_df["movieId"] == movie_id
    ].sort_values("similarity", ascending=False).head(limit)

    recommendations = []

    for row in matches.itertuples(index=False):
        recommended_id = int(row.similarMovieId)
        info = movie_info.get(recommended_id)

        if info is None:
            continue

        recommendations.append({
            "movieId": recommended_id,
            "title": info["title"],
            "genres": info["genres"],
            "similarity": round(float(row.similarity), 4),
        })

    return {
        "input_movie": {
            "movieId": movie_id,
            "title": movie_info[movie_id]["title"],
        },
        "recommendation_count": len(recommendations),
        "recommendations": recommendations,
    }


# --------------------------------------------------
# 7. Popular movies
# --------------------------------------------------

@app.get("/recommendations/popular")
def popular_movies(
    limit: int = Query(default=10, ge=1, le=50),
):
    movies = popularity_df.head(limit)

    return {
        "recommendation_type": "popularity",
        "recommendation_count": len(movies),
        "recommendations": [
            {
                "movieId": int(row.movieId),
                "title": row.title,
                "genres": row.genres,
                "rating_count": int(row.rating_count),
                "average_rating": round(
                    float(row.average_rating), 3
                ),
                "weighted_score": round(
                    float(row.weighted_score), 3
                ),
            }
            for row in movies.itertuples(index=False)
        ],
    }


# --------------------------------------------------
# 8. Personalized recommendations for a user
# --------------------------------------------------

@app.get("/recommendations/user/{user_id}")
def recommend_for_user(
    user_id: int,
    limit: int = Query(default=10, ge=1, le=50),
):
    ratings = load_user_histories()

    user_ratings = ratings[ratings["userId"] == user_id]

    if user_ratings.empty:
        raise HTTPException(
            status_code=404,
            detail="User not found in training data",
        )

    seen_movies = set(user_ratings["movieId"].tolist())

    liked_ratings = user_ratings[
        user_ratings["rating"] >= 4.0
    ]

    liked_movies = liked_ratings["movieId"].tolist()

    # Popularity fallback if the user has no highly rated movies.
    if not liked_movies:
        fallback = popularity_df[
            ~popularity_df["movieId"].isin(seen_movies)
        ].head(limit)

        recommendations = [
            {
                "movieId": int(row.movieId),
                "title": row.title,
                "genres": row.genres,
                "weighted_score": round(
                    float(row.weighted_score), 3
                ),
            }
            for row in fallback.itertuples(index=False)
        ]

        return {
            "userId": user_id,
            "recommendation_type": "popularity_fallback",
            "recommendation_count": len(recommendations),
            "recommendations": recommendations,
        }

    # Retrieve similar movies for the user's liked movies.
    liked_ids = set(int(mid) for mid in liked_movies)

    candidates = similarity_df[
        similarity_df["movieId"].isin(liked_ids)
    ].copy()

    if candidates.empty:
        fallback = popularity_df[
            ~popularity_df["movieId"].isin(seen_movies)
        ].head(limit)

        recommendations = [
            {
                "movieId": int(row.movieId),
                "title": row.title,
                "genres": row.genres,
                "weighted_score": round(
                    float(row.weighted_score), 3
                ),
            }
            for row in fallback.itertuples(index=False)
        ]

        return {
            "userId": user_id,
            "recommendation_type": "popularity_fallback",
            "recommendation_count": len(recommendations),
            "recommendations": recommendations,
        }

    # Weight similarity by how highly the user rated each source movie.
    rating_lookup = (
        liked_ratings.set_index("movieId")["rating"].to_dict()
    )

    candidates["user_preference"] = (
        candidates["movieId"].map(rating_lookup) - 3.0
    ).clip(lower=0.1)

    candidates["personalized_score"] = (
        candidates["similarity"]
        * candidates["user_preference"]
    )

    # Combine scores contributed by multiple liked movies.
    scores = (
        candidates.groupby("similarMovieId")["personalized_score"]
        .sum()
        .sort_values(ascending=False)
    )

    # Exclude every movie the user has already rated.
    scores = scores[~scores.index.isin(seen_movies)]

    recommendations = []

    for recommended_id, score in scores.items():
        recommended_id = int(recommended_id)
        info = movie_info.get(recommended_id)

        if info is None:
            continue

        recommendations.append({
            "movieId": recommended_id,
            "title": info["title"],
            "genres": info["genres"],
            "personalized_score": round(float(score), 4),
        })

        if len(recommendations) >= limit:
            break

    return {
        "userId": user_id,
        "recommendation_type": "personalized_item_similarity",
        "liked_movies_used": len(liked_ids),
        "recommendation_count": len(recommendations),
        "recommendations": recommendations,
    }
