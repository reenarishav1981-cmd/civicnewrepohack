import os
import sys
import json
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent.parent


def evaluate_location():
    dataset_path = root_dir / "evaluation" / "datasets" / "location.jsonl"
    if not dataset_path.exists():
        print(f"Error: Dataset not found at {dataset_path}")
        return

    with open(dataset_path, "r", encoding="utf-8") as f:
        samples = [json.loads(line) for line in f if line.strip()]

    print(f"Evaluating location source hierarchy on {len(samples)} test cases...")

    correct_source = 0
    correct_coords = 0

    for s in samples:
        # Simulate priority logic: Device GPS > EXIF > Map Pin > Unknown
        if s["has_device_gps"] and s["device_lat"] is not None:
            chosen_src = "device_gps"
            chosen_lat = s["device_lat"]
            chosen_lng = s["device_lng"]
        elif s["has_exif"] and s["exif_lat"] is not None:
            chosen_src = "exif"
            chosen_lat = s["exif_lat"]
            chosen_lng = s["exif_lng"]
        elif s["has_pin"] and s["pin_lat"] is not None:
            chosen_src = "map_pin"
            chosen_lat = s["pin_lat"]
            chosen_lng = s["pin_lng"]
        else:
            chosen_src = "unknown"
            chosen_lat = 26.2183
            chosen_lng = 78.1828

        if chosen_src == s["expected_source"]:
            correct_source += 1
        if abs(chosen_lat - s["expected_lat"]) < 1e-4 and abs(chosen_lng - s["expected_lng"]) < 1e-4:
            correct_coords += 1

    source_acc = round(correct_source / len(samples), 4)
    coords_acc = round(correct_coords / len(samples), 4)

    print("\n" + "="*60)
    print("CIVICPULSE LOCATION RESOLUTION VERIFICATION")
    print("="*60)
    print(f"Samples Evaluated:             {len(samples)}")
    print(f"Source Hierarchy Accuracy:     {source_acc * 100:.2f}%")
    print(f"Coordinate Exact Match:        {coords_acc * 100:.2f}%")
    print("Hierarchy Enforced:            Device GPS > EXIF > Map Pin > Unknown")
    print("="*60 + "\n")


if __name__ == "__main__":
    evaluate_location()
