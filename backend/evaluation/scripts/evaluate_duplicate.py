import os
import sys
import json
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir / "core-backend"))

from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.integrations.ai_engine_client import ai_client
from app.services.report_service import get_current_threshold


async def run_evaluation():
    dataset_path = root_dir / "evaluation" / "datasets" / "duplicate_pairs.jsonl"
    if not dataset_path.exists():
        print(f"Error: Dataset not found at {dataset_path}")
        return

    with open(dataset_path, "r", encoding="utf-8") as f:
        pairs = [json.loads(line) for line in f if line.strip()]

    threshold = get_current_threshold()
    print(f"Evaluating {len(pairs)} duplicate benchmark pairs using threshold={threshold}...")

    tp = 0  # True Duplicate identified as Duplicate
    fp = 0  # False Merge: Truly Different identified as Duplicate (CRITICAL PENALTY)
    tn = 0  # Truly Different identified as Different
    fn = 0  # False Split: True Duplicate identified as Different

    provider_used = "unknown"
    model_used = "unknown"
    pair_results = []

    for p in pairs:
        cand = [{
            "incident_id": "CP-EXISTING",
            "description": p["text_a"],
            "category": p["category"] if p["category"] != "different" else "road_damage",
            "latitude": 26.2185,
            "longitude": 78.1825,
            "timestamp": datetime.utcnow().isoformat()
        }]

        # Distance approximation
        # 1 deg lat ~= 111,000 m => d_m / 111,000
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
        pred_duplicate = sim_score >= threshold
        ground_truth = p["is_same_incident"]

        meta = dup_res.get("meta", {})
        provider_used = meta.get("provider", provider_used)
        model_used = meta.get("model", model_used)

        if ground_truth and pred_duplicate:
            tp += 1
            verdict = "TP"
        elif not ground_truth and pred_duplicate:
            fp += 1  # False Merge!
            verdict = "FP (False Merge)"
        elif not ground_truth and not pred_duplicate:
            tn += 1
            verdict = "TN"
        else:
            fn += 1  # False Split
            verdict = "FN (False Split)"

        pair_results.append({
            "pair_id": p["pair_id"],
            "similarity_score": round(sim_score, 3),
            "predicted_duplicate": pred_duplicate,
            "ground_truth_duplicate": ground_truth,
            "verdict": verdict
        })

    precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
    recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
    f1 = round((2 * precision * recall) / (precision + recall), 4) if (precision + recall) > 0 else 0.0

    false_merge_rate = round(fp / (fp + tn), 4) if (fp + tn) > 0 else 0.0
    false_split_rate = round(fn / (fn + tp), 4) if (fn + tp) > 0 else 0.0

    results = {
        "evaluation_run_id": f"EVAL-DUP-{int(datetime.utcnow().timestamp())}",
        "task_type": "duplicate",
        "dataset_version": "v1.0-hackathon-manual",
        "sample_count": len(pairs),
        "threshold_used": threshold,
        "metrics": {
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "false_merge_rate": false_merge_rate,
            "false_split_rate": false_split_rate,
            "confusion_matrix": {
                "true_positives": tp,
                "false_merges_fp": fp,
                "true_negatives_tn": tn,
                "false_splits_fn": fn
            }
        },
        "provider": provider_used,
        "model": model_used,
        "evaluation_status": "completed",
        "timestamp": datetime.utcnow().isoformat()
    }

    # Save
    out_file = root_dir / "evaluation" / "results" / "duplicate_benchmark_latest.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    await connect_to_mongo()
    db = await get_database()
    mongo_rec = results.copy()
    mongo_rec["timestamp"] = datetime.utcnow()
    await db.evaluation_runs.insert_one(mongo_rec)
    await close_mongo_connection()

    print("\n" + "="*60)
    print("CIVICPULSE DUPLICATE DETECTION BENCHMARK RESULTS")
    print("="*60)
    print(f"Evaluated Pairs:    {len(pairs)}")
    print(f"Applied Threshold:  {threshold}")
    print(f"Precision:          {precision * 100:.2f}%")
    print(f"Recall:             {recall * 100:.2f}%")
    print(f"F1-Score:           {f1 * 100:.2f}%")
    print(f"False Merge Rate:   {false_merge_rate * 100:.2f}% (CRITICAL: distinct incidents merged)")
    print(f"False Split Rate:   {false_split_rate * 100:.2f}% (same incidents kept separate)")
    print(f"Confusion Matrix:   TP={tp}, FP(False Merges)={fp}, TN={tn}, FN(False Splits)={fn}")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(run_evaluation())
