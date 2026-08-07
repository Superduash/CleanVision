"""
CleanVision - Dataset Preparation Script
=========================================
Merges both Roboflow CSV-annotated datasets (Dirty Floor + Unwashed Washroom)
and converts them to YOLOv8 format (normalized xywh .txt files).

Class mapping (combined):
  0: Muddy-Floor      → penalty -25  (active mud/dirt)
  1: Uncleaned-Floor  → penalty -20  (wet/unclean floor)
  2: Stain            → penalty -10  (visible staining)
  3: Rusty-Pipes      → penalty  0   (structural, IGNORED in scoring)

Usage:
  python ml/prepare_dataset.py
"""

import os
import shutil
import pandas as pd
from pathlib import Path

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent.parent          # project root
DATASET_DIR = BASE_DIR / "dataset"
OUT_DIR     = BASE_DIR / "ml" / "yolo_dataset"

SOURCES = [
    DATASET_DIR / "dirty_floor",
    DATASET_DIR / "unwashed_washroom",
]

SPLITS = ["train", "valid", "test"]

# ── Canonical class list (ORDER MATTERS for YOLO) ──────────────────────────
# Map every raw label (lowercase) → canonical name
RAW_TO_CANONICAL = {
    "muddy-floor":      "Muddy-Floor",
    "uncleaned floor":  "Uncleaned-Floor",
    "stain":            "Stain",
    "rusty pipes":      "Rusty-Pipes",
}

CLASSES = ["Muddy-Floor", "Uncleaned-Floor", "Stain", "Rusty-Pipes"]
CLASS_TO_ID = {c: i for i, c in enumerate(CLASSES)}

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def to_yolo_line(row, img_w, img_h, class_id):
    """Convert absolute xmin/ymin/xmax/ymax → YOLO normalized xywh."""
    xmin, ymin, xmax, ymax = row["xmin"], row["ymin"], row["xmax"], row["ymax"]
    x_center = ((xmin + xmax) / 2) / img_w
    y_center = ((ymin + ymax) / 2) / img_h
    width    = (xmax - xmin) / img_w
    height   = (ymax - ymin) / img_h
    return f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}"


def process_split(source_root: Path, split: str, img_out: Path, lbl_out: Path):
    """Process one train/valid/test split from one source dataset."""
    split_dir = source_root / split
    csv_path  = split_dir / "_annotations.csv"

    if not csv_path.exists():
        print(f"  ⚠  No annotations CSV in {split_dir}, skipping.")
        return 0, 0

    df = pd.read_csv(csv_path)
    # Normalise column names
    df.columns = df.columns.str.strip().str.lower()

    skipped = 0
    written = 0

    # Group by image file
    for filename, group in df.groupby("filename"):
        img_src = split_dir / filename
        if not img_src.exists():
            skipped += 1
            continue

        # Build unique destination name to avoid collisions between datasets
        src_tag  = source_root.name          # e.g. dirty_floor | unwashed_washroom
        stem     = Path(filename).stem
        new_name = f"{src_tag}__{stem}"
        img_dst  = img_out / f"{new_name}.jpg"
        lbl_dst  = lbl_out / f"{new_name}.txt"

        # Copy image
        shutil.copy2(img_src, img_dst)

        # Write YOLO label file
        lines = []
        for _, row in group.iterrows():
            raw_label = str(row["class"]).strip().lower()
            canonical = RAW_TO_CANONICAL.get(raw_label)
            if canonical is None:
                print(f"    ✗ Unknown class '{row['class']}' in {filename} — skipped")
                continue
            cid  = CLASS_TO_ID[canonical]
            line = to_yolo_line(row, float(row["width"]), float(row["height"]), cid)
            lines.append(line)

        if lines:
            lbl_dst.write_text("\n".join(lines))
            written += 1
        else:
            # No valid annotations → copy image with empty label (background)
            lbl_dst.write_text("")
            written += 1

    return written, skipped


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────
def main():
    print("\n╔══════════════════════════════════════════╗")
    print("║  CleanVision — Dataset Preparation       ║")
    print("╚══════════════════════════════════════════╝\n")

    # Create output directory tree
    for split in SPLITS:
        (OUT_DIR / "images" / split).mkdir(parents=True, exist_ok=True)
        (OUT_DIR / "labels" / split).mkdir(parents=True, exist_ok=True)

    totals = {s: {"written": 0, "skipped": 0} for s in SPLITS}

    for source in SOURCES:
        print(f"📂 Processing source: {source.name}")
        for split in SPLITS:
            img_out = OUT_DIR / "images" / split
            lbl_out = OUT_DIR / "labels" / split
            written, skipped = process_split(source, split, img_out, lbl_out)
            totals[split]["written"] += written
            totals[split]["skipped"] += skipped
            print(f"   [{split:5s}] ✔ {written} images written, {skipped} skipped")
        print()

    # ── Write data.yaml for YOLOv8 ──────────────────────────────────────────
    yaml_path = OUT_DIR / "data.yaml"
    yaml_content = f"""# CleanVision YOLOv8 Dataset Configuration
# Auto-generated by prepare_dataset.py

path: {OUT_DIR.as_posix()}
train: images/train
val:   images/valid
test:  images/test

nc: {len(CLASSES)}
names: {CLASSES}

# Penalty weights used by cvModel.js (NOT used during training)
# Muddy-Floor:      -25  (active dirt)
# Uncleaned-Floor:  -20  (wet/unclean surface)
# Stain:            -10  (visible staining)
# Rusty-Pipes:        0  (structural — ignored in scoring)
"""
    yaml_path.write_text(yaml_content)
    print(f"✅ data.yaml written → {yaml_path}")

    # ── Summary ─────────────────────────────────────────────────────────────
    print("\n── Final Summary ─────────────────────────────────")
    for split in SPLITS:
        print(f"  {split:5s}: {totals[split]['written']} images  ({totals[split]['skipped']} skipped)")
    print(f"\nClasses ({len(CLASSES)}): {', '.join(CLASSES)}")
    print("\n▶  Next step:  python ml/train_model.py")


if __name__ == "__main__":
    main()
