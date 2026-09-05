import os
import sys
import json
import asyncio
from pathlib import Path
from datetime import datetime

root_dir = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(root_dir / "core-backend"))

from app.integrations.ai_engine_client import ai_client


async def run_resolution_evaluation():
    dataset_path = root_dir / "evaluation" / "datasets" / "resolution.jsonl"
    if not dataset_path.exists():
        print(f"Error: Dataset not found at {dataset_path}")
        return

    with open(dataset_path, "r", encoding="utf-8") as f:
        samples = [json.loads(line) for line in f if line.strip()]

    print(f"Evaluating {len(samples)} resolution verification samples...")
    correct = 0
    manual_review_count = 0

    for s in samples:
        res = await ai_client.verify_resolution(
            before_image_url=s["before_image_url"],
            after_image_url=s["after_image_url"],
            category=s["category"],
            description=s["description"]
        )

        pred_status = res.get("verification_status", "manual_review_required")
        if pred_status in ["manual_review_required", "insufficient_evidence"]:
            manual_review_count += 1

        # Check resolution alignment
        if res.get("issue_resolved") == s["expected_resolved"]:
            correct += 1

    accuracy = round(correct / len(samples), 4) if samples else 0.0
    manual_review_rate = round(manual_review_count / len(samples), 4) if samples else 0.0

    print("\n" + "="*60)
    print("CIVICPULSE RESOLUTION VERIFICATION BENCHMARK")
    print("="*60)
    print(f"Evaluated Samples:    {len(samples)}")
    print(f"Resolution Accuracy:  {accuracy * 100:.2f}%")
    print(f"Manual Review Rate:   {manual_review_rate * 100:.2f}%")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(run_resolution_evaluation())
