import os
import sys
import json
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir / "core-backend"))

from app.integrations.ai_engine_client import ai_client


async def run_calibration():
    dataset_path = root_dir / "evaluation" / "datasets" / "duplicate_pairs.jsonl"
    if not dataset_path.exists():
        print(f"Error: Dataset not found at {dataset_path}")
        return

    with open(dataset_path, "r", encoding="utf-8") as f:
        pairs = [json.loads(line) for line in f if line.strip()]

    print(f"Calibrating duplicate threshold over {len(pairs)} labelled pairs...")

    # Step 1: Pre-calculate similarity scores for each pair
    pair_scores = []
    for p in pairs:
        cand = [{
            "incident_id": "CP-EXISTING",
            "description": p["text_a"],
            "category": p["category"] if p["category"] != "different" else "road_damage",
            "latitude": 26.2185,
            "longitude": 78.1825,
            "timestamp": datetime.utcnow().isoformat()
        }]
        d_lat = (p["distance_meters"] / 111000.0)
        new_lat = 26.2185 + d_lat
        new_lng = 78.1825

        dup_res = await ai_client.detect_duplicate(
            description=p["text_b"],
            category=p["category"] if p["category"] != "different" else "pothole",
            latitude=new_lat,
            longitude=new_lng,
            existing_incidents=cand
        )

        sim_score = float(dup_res.get("similarity_score", 0.0))
        pair_scores.append({
            "score": sim_score,
            "is_duplicate_engine": bool(dup_res.get("is_duplicate")),
            "ground_truth": p["is_same_incident"]
        })

    # Step 2: Sweep thresholds
    candidate_thresholds = [0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90]
    table = []

    best_threshold = 0.72
    min_cost = float("inf")
    best_f1 = -1.0

    for th in candidate_thresholds:
        tp, fp, tn, fn = 0, 0, 0, 0
        for ps in pair_scores:
            pred = ps["score"] >= th
            gt = ps["ground_truth"]

            if gt and pred:
                tp += 1
            elif not gt and pred:
                fp += 1  # False Merge!
            elif not gt and not pred:
                tn += 1
            else:
                fn += 1  # False Split

        prec = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
        rec = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
        f1 = round((2 * prec * rec) / (prec + rec), 4) if (prec + rec) > 0 else 0.0
        false_merge_rate = round(fp / (fp + tn), 4) if (fp + tn) > 0 else 0.0
        false_split_rate = round(fn / (fn + tp), 4) if (fn + tp) > 0 else 0.0

        # Asymmetric operational loss: penalize False Merge 3x heavier than False Split
        cost = (fp * 3.0) + (fn * 1.0)

        row = {
            "threshold": th,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "false_merge_rate": false_merge_rate,
            "false_split_rate": false_split_rate,
            "false_merges_fp": fp,
            "false_splits_fn": fn,
            "operational_loss": cost
        }
        table.append(row)

        if cost < min_cost or (cost == min_cost and f1 > best_f1):
            min_cost = cost
            best_f1 = f1
            best_threshold = th

    calibration_output = {
        "default_threshold": 0.72,
        "calibrated_threshold": best_threshold,
        "calibration_status": "calibrated",
        "dataset_version": "v1.0-hackathon-manual",
        "sample_count": len(pairs),
        "timestamp": datetime.utcnow().isoformat(),
        "objective": "asymmetric_false_merge_penalty_3x",
        "threshold_performance": table
    }

    out_file = root_dir / "evaluation" / "results" / "duplicate_threshold.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(calibration_output, f, indent=2)

    print("\n" + "="*75)
    print("CIVICPULSE DUPLICATE THRESHOLD CALIBRATION REPORT")
    print("="*75)
    print(f"{'Threshold':>10} | {'Prec':>6} | {'Recall':>6} | {'F1':>6} | {'FalseMerge':>10} | {'FalseSplit':>10} | {'Loss':>6}")
    print("-" * 75)
    for r in table:
        star = " * (OPTIMAL)" if r["threshold"] == best_threshold else ""
        print(f"{r['threshold']:>10.2f} | {r['precision']:>6.2f} | {r['recall']:>6.2f} | {r['f1_score']:>6.2f} | {r['false_merge_rate']:>10.2f} | {r['false_split_rate']:>10.2f} | {r['operational_loss']:>6.1f}{star}")
    print("-" * 75)
    print(f"Optimal Calibrated Threshold: {best_threshold} (Saved to {out_file})")
    print("="*75 + "\n")


if __name__ == "__main__":
    asyncio.run(run_calibration())
