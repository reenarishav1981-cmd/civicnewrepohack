import os
import sys
import json
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List

# Ensure core-backend and app are available
root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir / "core-backend"))

from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.integrations.ai_engine_client import ai_client


def compute_metrics(y_true: List[str], y_pred: List[str]) -> Dict[str, Any]:
    if not y_true:
        return {"accuracy": 0.0, "macro_f1": 0.0, "per_class": {}}

    classes = sorted(list(set(y_true + y_pred)))
    correct = sum(1 for yt, yp in zip(y_true, y_pred) if yt == yp)
    accuracy = round(correct / len(y_true), 4)

    per_class = {}
    f1_list = []
    for c in classes:
        tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == c and yp == c)
        fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt != c and yp == c)
        fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == c and yp != c)
        prec = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
        rec = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
        f1 = round((2 * prec * rec) / (prec + rec), 4) if (prec + rec) > 0 else 0.0
        per_class[c] = {
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "support": sum(1 for yt in y_true if yt == c)
        }
        if sum(1 for yt in y_true if yt == c) > 0:
            f1_list.append(f1)

    macro_f1 = round(sum(f1_list) / len(f1_list), 4) if f1_list else 0.0
    return {
        "accuracy": accuracy,
        "macro_f1": macro_f1,
        "sample_count": len(y_true),
        "per_class": per_class
    }


async def run_evaluation():
    dataset_path = root_dir / "evaluation" / "datasets" / "classification.jsonl"
    if not dataset_path.exists():
        print(f"Error: Dataset not found at {dataset_path}")
        return

    with open(dataset_path, "r", encoding="utf-8") as f:
        samples = [json.loads(line) for line in f if line.strip()]

    print(f"Loaded {len(samples)} classification samples. Executing evaluation against AI Engine...")

    y_true_all, y_pred_all = [], []
    by_lang = {"english": {"true": [], "pred": []}, "hindi": {"true": [], "pred": []}, "hinglish": {"true": [], "pred": []}}

    provider_used = "unknown"
    model_used = "unknown"

    for s in samples:
        res = await ai_client.analyze_complaint(s["text"])
        pred_cat = res.get("category", "other")
        expected = s["expected_category"]
        lang = s.get("language", "english")

        meta = res.get("meta", {})
        provider_used = meta.get("provider", provider_used)
        model_used = meta.get("model", model_used)

        y_true_all.append(expected)
        y_pred_all.append(pred_cat)

        if lang in by_lang:
            by_lang[lang]["true"].append(expected)
            by_lang[lang]["pred"].append(pred_cat)

    overall_metrics = compute_metrics(y_true_all, y_pred_all)
    lang_metrics = {}
    for lang, data in by_lang.items():
        if data["true"]:
            lang_metrics[lang] = compute_metrics(data["true"], data["pred"])

    evaluation_record = {
        "evaluation_run_id": f"EVAL-CLS-{int(datetime.utcnow().timestamp())}",
        "task_type": "classification",
        "dataset_version": "v1.0-hackathon-manual",
        "sample_count": len(samples),
        "dataset_limitations": "Small curated hackathon benchmark (36 samples). Not statistically representative of production city scale.",
        "provider": provider_used,
        "model": model_used,
        "metrics": overall_metrics,
        "per_class_metrics": overall_metrics["per_class"],
        "language_metrics": lang_metrics,
        "evaluation_status": "completed",
        "timestamp": datetime.utcnow().isoformat()
    }

    # Save to results file
    results_dir = root_dir / "evaluation" / "results"
    results_dir.mkdir(parents=True, exist_ok=True)
    with open(results_dir / "evaluation_latest.json", "w", encoding="utf-8") as f:
        json.dump(evaluation_record, f, indent=2, ensure_ascii=False)

    # Persist to MongoDB
    await connect_to_mongo()
    db = await get_database()
    mongo_rec = evaluation_record.copy()
    mongo_rec["timestamp"] = datetime.utcnow()
    await db.evaluation_runs.insert_one(mongo_rec)
    await close_mongo_connection()

    print("\n" + "="*60)
    print("CIVICPULSE CLASSIFICATION BENCHMARK RESULTS")
    print("="*60)
    print(f"Dataset: classification.jsonl ({len(samples)} samples)")
    print(f"Overall Accuracy: {overall_metrics['accuracy'] * 100:.2f}%")
    print(f"Macro-F1 Score:   {overall_metrics['macro_f1'] * 100:.2f}%")
    print("\nLanguage Breakdown:")
    for lang, m in lang_metrics.items():
        print(f"  - {lang.capitalize():8}: Accuracy: {m['accuracy']*100:.1f}%, Macro-F1: {m['macro_f1']*100:.1f}% ({m['sample_count']} samples)")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(run_evaluation())
