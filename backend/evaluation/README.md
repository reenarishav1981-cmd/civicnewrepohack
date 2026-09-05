# 📊 CivicPulse AI Evaluation & Benchmark Framework

This directory contains the reproducible evaluation harness, ground-truth labelled datasets, and threshold calibration pipelines for the CivicPulse intelligence engine.

---

## ⚠️ Dataset Limitations & Attribution

> **Transparency Note**: The datasets contained in `datasets/` comprise **small, manually curated hackathon benchmark sets** (e.g. 36 classification samples, 24 duplicate pairs).
> They are designed for verifiable pipeline validation and integration testing, **not** statistically representative production city-scale validation.
> CivicPulse never fabricates confidence, accuracy, or F1 scores. Every metric reported by the API or dashboard is directly computed from these labelled files or stored MongoDB audit logs.

---

## 📂 Directory Structure

```text
evaluation/
├── datasets/
│   ├── classification.jsonl       # 36 multilingual complaints (English, Hindi, Hinglish)
│   ├── duplicate_pairs.jsonl      # 24 pairs with explicit SAME / DIFFERENT ground truth
│   ├── resolution.jsonl           # 12 before/after resolution verification test cases
│   └── location.jsonl             # 10 location hierarchy & fallback test cases
│
├── scripts/
│   ├── evaluate_classification.py # Computes Accuracy, Macro-F1, per-class & language metrics
│   ├── evaluate_duplicate.py      # Computes Precision, Recall, False Merge & False Split rates
│   ├── calibrate_duplicate_threshold.py # Sweeps candidate thresholds with asymmetric loss
│   ├── evaluate_resolution.py     # Verifies before/after repair inspection & manual review rate
│   └── evaluate_location.py       # Validates Device GPS > EXIF > Map Pin > Unknown hierarchy
│
└── results/
    ├── evaluation_latest.json     # Latest classification benchmark run
    ├── duplicate_benchmark_latest.json # Latest duplicate detection benchmark run
    └── duplicate_threshold.json   # Optimal calibrated threshold for Core Backend
```

---

## 🚀 Reproduction Commands

Run evaluation benchmarks using the virtual environment:

```bash
# 1. Evaluate Multilingual Classification (English, Hindi, Hinglish)
.\venv\Scripts\python -m evaluation.scripts.evaluate_classification

# 2. Calibrate Duplicate Threshold (Asymmetric False Merge Penalty)
.\venv\Scripts\python -m evaluation.scripts.calibrate_duplicate_threshold

# 3. Evaluate Duplicate Incident Detection Benchmark
.\venv\Scripts\python -m evaluation.scripts.evaluate_duplicate

# 4. Evaluate Resolution Verification (Before / After CV)
.\venv\Scripts\python -m evaluation.scripts.evaluate_resolution

# 5. Evaluate Location Extraction & Hierarchy Fallback
.\venv\Scripts\python -m evaluation.scripts.evaluate_location
```

---

## 📈 Metric Definitions

- **False Merge Rate**: Frequency at which two genuinely distinct civic issues are incorrectly merged into a single incident (`FP / (FP + TN)`). In municipal operations, false merges corrupt field routing and must be penalized severely.
- **False Split Rate**: Frequency at which complaints belonging to the same underlying physical issue are incorrectly treated as separate incidents (`FN / (FN + TP)`).
- **Macro-F1**: Unweighted mean of F1-scores across all civic categories, ensuring rare critical categories (e.g. sewage, electricity) are not masked by frequent categories (potholes).
