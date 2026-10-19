# Large-Scale Personalized Recommendation Engine

A personalized movie recommendation system built using MovieLens 25M, Python, item-based collaborative filtering, FastAPI, and React.

The current implementation includes a popularity-based baseline, item-similarity retrieval, offline evaluation, a REST API, and an interactive React frontend.

## Table of Contents

- [Overview](#overview)
- [Current Features](#current-features)
- [Architecture](#architecture)
- [Dataset](#dataset)
- [Evaluation Results](#evaluation-results)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [Prepare the Dataset](#prepare-the-dataset)
- [Build Recommendation Artifacts](#build-recommendation-artifacts)
- [Run the Backend](#run-the-backend)
- [Run the Frontend](#run-the-frontend)
- [Run Tests](#run-tests)
- [API Endpoints](#api-endpoints)
- [Limitations and Future Work](#limitations-and-future-work)

## Overview

The goal is to build a scalable, personalized recommendation engine that suggests movies using users' historical ratings and item-to-item similarities.

The current system uses item-based collaborative filtering to generate personalized recommendations and compares its offline ranking quality against a popularity-based baseline.

## Current Features

- MovieLens 25M dataset auditing and validation.
- Chronological training, validation, and test split.
- Popularity-based recommendation baseline with Bayesian smoothing.
- Item-based collaborative filtering using positive user ratings.
- Top-K similar-movie artifact generation.
- Offline Recall@10 and NDCG@10 evaluation.
- FastAPI endpoints for popular, similar-movie, and personalized recommendations.
- React and Vite frontend for interactive personalized recommendations.
- Automated API tests using pytest.

## Architecture

```text
MovieLens 25M
     |
     v
Dataset Audit and Temporal Split
     |
     +-----------------------------+
     |                             |
     v                             v
Popularity Baseline       Item Similarity Model
     |                             |
     v                             v
Popularity Ranking        Top-K Similar-Movie Artifact
     |                             |
     +--------------+--------------+
                    |
                    v
              FastAPI Backend
                    |
                    v
             React + Vite UI
```

The current item-based collaborative filtering implementation uses historical user ratings to find related movies. The API combines item similarities with a user's positive rating history and excludes movies already rated by that user.

## Dataset

This project uses the MovieLens 25M ratings dataset.

Dataset audit results:

| Metric | Value |
|---|---:|
| Total ratings | 25,000,095 |
| Unique users | 162,541 |
| Unique rated movies | 59,047 |
| Total movies in metadata | 62,423 |
| Missing rating values | 0 |
| Duplicate movie IDs in movie metadata | 0 |

The processed training dataset contains 20,062,533 interactions. The split is chronological per user to reduce temporal leakage during evaluation.

| Split | Interactions |
|---|---:|
| Training | 20,062,533 |
| Validation | 2,506,501 |
| Test | 2,431,061 |

A rating of 4.0 or higher is treated as a relevant interaction for the reported ranking evaluation.

Download MovieLens 25M from the official source:

https://grouplens.org/datasets/movielens/25m/

Extract the dataset so that the raw files are available under `data/raw/ml-25m/`. Do not commit the full dataset to Git.

## Evaluation Results

The following results come from the offline item-similarity evaluation report. Both methods use the same evaluated user cohort and exclude items seen in training.

| Metric | Popularity Baseline | Item-Based Collaborative Filtering |
|---|---:|---:|
| Evaluated users | 150,626 | 150,626 |
| Recall@10 | 0.024811 | 0.081949 |
| NDCG@10 | 0.020305 | 0.070637 |

### Interpretation

- Recall@10 improves by 0.057138 in absolute terms.
- NDCG@10 improves by 0.050332 in absolute terms.
- Item-based collaborative filtering achieves approximately 3.30 times the baseline Recall@10 on this evaluation cohort.

These are offline ranking metrics, not online A/B test results. They do not establish production performance or business impact.

A separate popularity evaluation report uses a different protocol and cohort. Its results should not be directly compared with the table above.

## Technology Stack

### Currently implemented

- Python
- Pandas and NumPy
- scikit-learn / SciPy dependencies
- FastAPI
- Uvicorn
- React
- Vite
- pytest

### Planned or not yet verified as implemented

- TensorFlow Recommenders and Two-Tower retrieval
- FAISS vector search
- Deep & Cross Network (DCN) ranking
- PySpark distributed processing
- Redis caching
- Docker-based deployment
- Airflow orchestration
- NVIDIA Triton inference serving

These technologies are part of the broader project direction, not claims about the current working implementation.

## Project Structure

```text
large-scale-recommendation-engine/
├── backend/
│   └── main.py
├── configs/
├── data/
│   ├── raw/
│   ├── processed/
│   └── reports/
├── docs/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── infra/
├── ml/
│   ├── evaluation/
│   │   ├── evaluate_item_similarity.py
│   │   ├── evaluate_popularity.py
│   │   └── evaluate_popularity_v2.py
│   ├── retrieval/
│   │   ├── item_similarity.py
│   │   └── popularity_baseline.py
│   └── artifacts/
├── scripts/
│   ├── audit_dataset.py
│   ├── prepare_dataset.py
│   └── validate_split.py
├── tests/
│   └── test_api.py
├── requirements.txt
├── requirements-dev.txt
└── README.md
```

Generated data and model artifacts may be excluded from Git. Generate them locally before starting the backend.

## Setup and Installation

### Prerequisites

- Python 3.10
- Node.js and npm
- Git
- MovieLens 25M dataset

Run commands from the repository root in PowerShell.

### 1. Create and activate a virtual environment

```powershell
py -3.10 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, invoke the environment's Python executable directly instead.

### 2. Install dependencies

For application dependencies:

```powershell
python -m pip install -r requirements.txt
```

For development and testing:

```powershell
python -m pip install -r requirements-dev.txt
```

### 3. Install frontend dependencies

```powershell
npm --prefix .\frontend install
```

## Prepare the Dataset

Run the dataset audit:

```powershell
python .\scripts\audit_dataset.py
```

Prepare chronological train, validation, and test files:

```powershell
python .\scripts\prepare_dataset.py
```

Validate the generated split:

```powershell
python .\scripts\validate_split.py
```

The processed training file is expected at:

`data/processed/train.csv.gz`

Use the generated audit and validation reports to verify dataset integrity.

## Build Recommendation Artifacts

Run these commands from the repository root after preparing the dataset.

### 1. Build the popularity baseline

```powershell
python .\ml\retrieval\popularity_baseline.py
```

### 2. Build item-similarity recommendations

```powershell
python .\ml\retrieval\item_similarity.py
```

The backend expects these artifacts:

- `ml/artifacts/popularity_ranking.csv`
- `ml/artifacts/item_similarity_topk.csv`

### 3. Evaluate the models

```powershell
python .\ml\evaluation\evaluate_popularity.py
python .\ml\evaluation\evaluate_popularity_v2.py
python .\ml\evaluation\evaluate_item_similarity.py
```

Evaluation reports are written under `data/reports/` by the respective scripts.

## Run the Backend

Ensure the dataset and both required recommendation artifacts exist.

Start FastAPI from the repository root:

```powershell
python -m uvicorn backend.main:app --reload
```

The API is available at:

- Base URL: `http://127.0.0.1:8000`
- Interactive API documentation: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

Keep this terminal running while using the frontend.

## Run the Frontend

Open a second PowerShell terminal at the repository root:

```powershell
npm --prefix .\frontend run dev
```

Open the local URL printed by Vite, usually:

`http://localhost:5173`

The Vite development server proxies `/api` requests to the local FastAPI server on port 8000.

To create a production build:

```powershell
npm --prefix .\frontend run build
```

## Run Tests

Install development dependencies, then run:

```powershell
python -m pytest -v
```

The API test suite checks health and home endpoints, recommendation responses, input limits, unknown IDs, and exclusion of previously rated movies.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API home/status |
| GET | `/health` | Health and artifact status |
| GET | `/recommendations/popular?limit=10` | Popular movie recommendations |
| GET | `/recommendations/movie/{movie_id}?limit=10` | Similar movies |
| GET | `/recommendations/user/{user_id}?limit=10` | Personalized recommendations |

Example requests:

```text
GET http://127.0.0.1:8000/health
GET http://127.0.0.1:8000/recommendations/popular?limit=10
GET http://127.0.0.1:8000/recommendations/movie/318?limit=10
GET http://127.0.0.1:8000/recommendations/user/1?limit=10
```

The API validates recommendation limits and returns an error for unknown movie or user IDs.

## Limitations and Future Work

The current implementation is a working baseline-oriented recommendation system. It is not yet the complete neural two-stage architecture originally envisioned.

Potential next steps:

1. Add a Two-Tower retrieval model and evaluate it against item-based retrieval.
2. Integrate FAISS if vector retrieval is implemented and benchmarked.
3. Add a learned ranking model such as DCN and compare it using the same evaluation protocol.
4. Add Redis caching and measure its effect on latency.
5. Add reproducible Docker deployment and workflow orchestration.
6. Expand monitoring, API observability, and frontend evaluation views.
7. Run additional robustness and performance tests.

Advanced components should be described as completed only after their implementation and results have been verified.

## License and Dataset Attribution

MovieLens data is provided by GroupLens Research. Refer to the official dataset page for applicable terms and attribution:

https://grouplens.org/datasets/movielens/25m/
