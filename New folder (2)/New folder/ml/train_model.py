"""
CleanVision - YOLOv8 Training Script
======================================
Trains a YOLOv8n (nano) object detection model on the merged bathroom
cleanliness dataset. Nano is chosen for speed and server deployment;
swap to yolov8s/yolov8m for higher accuracy if you have a GPU.

Key design decisions:
  • mosaic=0.5 reduces aggressive augmentation (old-tile context must be preserved)
  • hsv_s=0.3 / hsv_v=0.3 — mild colour shifts only (old tiles ≠ dirty)
  • degrees=10 — slight rotation for handheld camera variance
  • Rusty-Pipes class is trained normally so the model DETECTS it,
    but the scoring logic in cvModel.js assigns it 0 penalty.

Usage:
  python ml/train_model.py
"""

import os
import sys
from pathlib import Path

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent.parent
ML_DIR      = BASE_DIR / "ml"
DATASET_YAML = ML_DIR / "yolo_dataset" / "data.yaml"
RUNS_DIR    = ML_DIR / "runs"

MODEL_SIZE  = "yolov8n"   # nano — fast, CPU-friendly; use yolov8s for better accuracy
EPOCHS      = 80          # Increase to 150 if you have a GPU
IMG_SIZE    = 640
BATCH       = 8           # Lower to 4 if RAM < 8 GB
PATIENCE    = 20          # Early stopping patience
WORKERS     = 2           # Data loader workers (keep low on Windows)
PROJECT     = str(RUNS_DIR)
RUN_NAME    = "cleanvision_v1"


def check_dataset():
    if not DATASET_YAML.exists():
        print("❌  Dataset not prepared yet!")
        print("   Run:  python ml/prepare_dataset.py")
        sys.exit(1)

    train_imgs = list((ML_DIR / "yolo_dataset" / "images" / "train").glob("*.jpg"))
    if len(train_imgs) < 10:
        print(f"❌  Too few training images ({len(train_imgs)}). Run prepare_dataset.py first.")
        sys.exit(1)

    print(f"✅  Dataset ready: {len(train_imgs)} training images found.")


def train():
    print("\n╔══════════════════════════════════════════╗")
    print("║  CleanVision — YOLOv8 Training           ║")
    print("╚══════════════════════════════════════════╝\n")

    check_dataset()

    try:
        from ultralytics import YOLO
    except ImportError:
        print("❌  ultralytics not installed.")
        print("   Run:  pip install -r ml/requirements.txt")
        sys.exit(1)

    print(f"🚀  Loading base model: {MODEL_SIZE}.pt")
    model = YOLO(f"{MODEL_SIZE}.pt")   # Downloads pretrained weights on first run

    print(f"📊  Training config:")
    print(f"    epochs   = {EPOCHS}")
    print(f"    imgsz    = {IMG_SIZE}")
    print(f"    batch    = {BATCH}")
    print(f"    patience = {PATIENCE}")
    print(f"    device   = auto (GPU if available, else CPU)\n")

    results = model.train(
        data        = str(DATASET_YAML),
        epochs      = EPOCHS,
        imgsz       = IMG_SIZE,
        batch       = BATCH,
        patience    = PATIENCE,
        workers     = WORKERS,
        project     = PROJECT,
        name        = RUN_NAME,
        exist_ok    = True,

        # ── Augmentation tuned for OLD HOSPITAL bathrooms ──────────────────
        # Mild augmentation: we want the model to generalise across
        # lighting/angle variation WITHOUT confusing aged tiles with dirt.
        mosaic      = 0.5,    # reduce mosaic (keeps tile context intact)
        hsv_h       = 0.01,   # minimal hue shift
        hsv_s       = 0.3,    # moderate saturation shift
        hsv_v       = 0.3,    # moderate brightness shift
        degrees     = 10,     # handheld camera tilt variance
        translate   = 0.1,    # slight translation
        scale       = 0.3,    # scale jitter
        fliplr      = 0.5,    # horizontal flip (bathrooms are symmetric)
        flipud      = 0.0,    # no vertical flip (floor stays at bottom)
        # ───────────────────────────────────────────────────────────────────

        # Save settings
        save        = True,
        save_period = 10,
        plots       = True,
        verbose     = True,
    )

    best_model = Path(PROJECT) / RUN_NAME / "weights" / "best.pt"
    if best_model.exists():
        print(f"\n✅  Training complete!")
        print(f"   Best model saved → {best_model}")
        print(f"\n▶  Next step:  python ml/export_model.py")
    else:
        print("\n⚠  Training finished but best.pt not found. Check the runs/ directory.")

    return results


def validate():
    """Run validation metrics on the best saved model."""
    from ultralytics import YOLO
    best = Path(PROJECT) / RUN_NAME / "weights" / "best.pt"
    if not best.exists():
        print("No trained model found — run training first.")
        return

    print("\n📊  Running validation…")
    model = YOLO(str(best))
    metrics = model.val(data=str(DATASET_YAML), imgsz=IMG_SIZE)
    print(f"\n   mAP50:     {metrics.box.map50:.4f}")
    print(f"   mAP50-95:  {metrics.box.map:.4f}")
    print(f"   Precision: {metrics.box.mp:.4f}")
    print(f"   Recall:    {metrics.box.mr:.4f}")


if __name__ == "__main__":
    train()
    validate()
