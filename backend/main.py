
from pathlib import Path
import json

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

DEMO_RECOMMENDATIONS_FILE = (
    PROJECT_ROOT / "ml" / "artifacts" / "demo_recommendations.json"
)


# --------------------------------------------------
# 2. FastAPI application
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

for file_path in [
    SIMILARITY_FILE,
    POPULARITY_FILE,
    DEMO_RECOMMENDATIONS_FILE,
]:
    if not file_path.exists():
        raise FileNotFoundError(
            f"Required recommendation artifact not found: {file_path}"
        )


similarity_df = pd.read_csv(SIMILARITY_FILE)
popularity_df = pd.read_csv(POPULARITY_FILE)

with open(
    DEMO_RECOMMENDATIONS_FILE,
    "r",
    encoding="utf-8-sig",
) as file:
    demo_recommendations = json.load(file)


# --------------------------------------------------
# 4. Prepare recommendation data
# --------------------------------------------------

similarity_df["movieId"] = similarity_df["movieId"].astype(int)
similarity_df["similarMovieId"] = (
    similarity_df["similarMovieId"].astype(int)
)

popularity_df["movieId"] = popularity_df["movieId"].astype(int)

movie_info = popularity_df.set_index("movieId").to_dict("index")


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
        "demo_recommendations_loaded": bool(demo_recommendations),
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

    matches = (
        similarity_df[similarity_df["movieId"] == movie_id]
        .sort_values("similarity", ascending=False)
        .head(limit)
    )

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
                "average_rating": round(float(row.average_rating), 3),
                "weighted_score": round(float(row.weighted_score), 3),
            }
            for row in movies.itertuples(index=False)
        ],
    }


# --------------------------------------------------
# 8. Precomputed personalized demo recommendations
# --------------------------------------------------

@app.get("/recommendations/user/{user_id}")
def recommend_for_user(
    user_id: int,
    limit: int = Query(default=10, ge=1, le=50),
):
    user_data = demo_recommendations.get(str(user_id))

    if user_data is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Demo recommendations unavailable for this user. "
                "Try user ID 1, 2, or 3."
            ),
        )

    recommendations = user_data["recommendations"][:limit]

    return {
        "userId": user_id,
        "recommendation_type": "precomputed_demo_personalized",
        "liked_movies_used": user_data.get("liked_movies_used", 0),
        "recommendation_count": len(recommendations),
        "recommendations": recommendations,
    }
