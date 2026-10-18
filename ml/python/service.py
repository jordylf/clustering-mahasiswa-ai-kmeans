"""
Python ML service (FastAPI + scikit-learn) untuk clustering ketergantungan Generative AI.

Kontrak input/output sama dengan engine TypeScript (ml/clustering/index.ts), sehingga
Next.js cukup mengisi ML_API_URL untuk berpindah engine.

Menjalankan service:
    pip install -r ml/python/requirements.txt
    uvicorn service:app --app-dir ml/python --port 8000

Validasi hasil terhadap dataset hasil export (CSV "Feature preprocessing"):
    python ml/python/service.py --csv features-2026-01-01.csv --k 3
"""

from __future__ import annotations

import argparse

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

FEATURES = [
    "frequency_score",
    "task_dependency_score",
    "academic_usage_score",
    "verification_score",
    "trust_score",
]


def standardize_features(X: np.ndarray) -> tuple[np.ndarray, StandardScaler]:
    scaler = StandardScaler()
    return scaler.fit_transform(X), scaler


def run_kmeans(Z: np.ndarray, k: int, seed: int = 42) -> KMeans:
    return KMeans(n_clusters=k, init="k-means++", n_init=10, max_iter=300, tol=1e-4, random_state=seed).fit(Z)


def calculate_silhouette(Z: np.ndarray, labels: np.ndarray) -> float:
    return float(silhouette_score(Z, labels)) if len(set(labels)) > 1 else 0.0


def find_optimal_k(Z: np.ndarray, k_min: int = 2, k_max: int = 6, seed: int = 42) -> dict:
    results = []
    for k in range(k_min, min(k_max, len(Z) - 1) + 1):
        km = run_kmeans(Z, k, seed)
        results.append({"k": k, "inertia": float(km.inertia_), "silhouette": calculate_silhouette(Z, km.labels_)})
    best = max(results, key=lambda r: r["silhouette"])
    return {"results": results, "recommendedK": best["k"]}


def run_pca(Z: np.ndarray) -> PCA:
    return PCA(n_components=2).fit(Z)


def cluster(features: list[list[float]], k: int, seed: int = 42) -> dict:
    X = np.asarray(features, dtype=float)
    Z, scaler = standardize_features(X)
    km = run_kmeans(Z, k, seed)
    pca = run_pca(Z)
    distances = np.linalg.norm(Z - km.cluster_centers_[km.labels_], axis=1)
    return {
        "labels": km.labels_.tolist(),
        "centroids": km.cluster_centers_.tolist(),
        "centroidsOriginal": scaler.inverse_transform(km.cluster_centers_).tolist(),
        "distances": distances.tolist(),
        "inertia": float(km.inertia_),
        "iterations": int(km.n_iter_),
        "silhouette": calculate_silhouette(Z, km.labels_),
        "scalerMean": scaler.mean_.tolist(),
        "scalerStd": scaler.scale_.tolist(),
        "pca": {
            "points": pca.transform(Z).tolist(),
            "explainedVarianceRatio": pca.explained_variance_ratio_.tolist(),
        },
    }


def create_app():
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel, Field

    class ClusterRequest(BaseModel):
        features: list[list[float]]
        k: int = Field(3, ge=2, le=10)
        seed: int = 42

    class EvaluateRequest(BaseModel):
        features: list[list[float]]
        k_min: int = 2
        k_max: int = 6
        seed: int = 42

    api = FastAPI(title="GenAI Dependency Clustering ML Service")

    @api.get("/health")
    def health():
        return {"status": "ok"}

    @api.post("/cluster")
    def cluster_endpoint(req: ClusterRequest):
        if len(req.features) <= req.k:
            raise HTTPException(400, "Jumlah data harus lebih besar dari k")
        return cluster(req.features, req.k, req.seed)

    @api.post("/evaluate")
    def evaluate_endpoint(req: EvaluateRequest):
        Z, _ = standardize_features(np.asarray(req.features, dtype=float))
        return find_optimal_k(Z, req.k_min, req.k_max, req.seed)

    return api


try:
    app = create_app()
except ImportError:  # FastAPI tidak wajib untuk mode CLI
    app = None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validasi K-Means dengan scikit-learn")
    parser.add_argument("--csv", required=True, help="CSV export 'Feature preprocessing' atau 'Dataset lengkap'")
    parser.add_argument("--k", type=int, default=3)
    args = parser.parse_args()

    df = pd.read_csv(args.csv).dropna(subset=FEATURES)
    X = df[FEATURES].to_numpy()
    Z, _ = standardize_features(X)
    evaluation = find_optimal_k(Z)
    print(pd.DataFrame(evaluation["results"]).to_string(index=False))
    print(f"K direkomendasikan (silhouette): {evaluation['recommendedK']}")

    out = cluster(X.tolist(), args.k)
    df["cluster"] = out["labels"]
    print(f"\nK={args.k} silhouette={out['silhouette']:.4f} inertia={out['inertia']:.4f} iterasi={out['iterations']}")
    print("\nCentroid (skala asli):")
    print(pd.DataFrame(out["centroidsOriginal"], columns=FEATURES).round(3).to_string())
    print("\nJumlah anggota:")
    print(df["cluster"].value_counts().sort_index().to_string())
