"""
CleanVision - ONNX Export Script
==================================
Exports the trained YOLOv8 best.pt model to ONNX format so it can be
loaded by onnxruntime-node inside the Express backend (cvModel.js).

The exported file is placed at:
  server/model/cleanvision.onnx

Usage:
  python ml/export_model.py
"""

import sys
import shutil
from pathlib import Path

BASE_DIR    = Path(__file__).parent.parent
ML_DIR      = BASE_DIR / "ml"
RUNS_DIR    = ML_DIR / "runs"
RUN_NAME    = "cleanvision_v1"

BEST_PT     = RUNS_DIR / RUN_NAME / "weights" / "best.pt"
MODEL_OUT   = BASE_DIR / "server" / "model"
ONNX_OUT    = MODEL_OUT / "cleanvision.onnx"


def export():
    print("\n╔══════════════════════════════════════════╗")
    print("║  CleanVision — ONNX Export               ║")
    print("╚══════════════════════════════════════════╝\n")

    if not BEST_PT.exists():
        print(f"❌  Trained model not found at: {BEST_PT}")
        print("   Run:  python ml/train_model.py  first.")
        sys.exit(1)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("❌  ultralytics not installed. Run:  pip install -r ml/requirements.txt")
        sys.exit(1)

    MODEL_OUT.mkdir(parents=True, exist_ok=True)

    print(f"📦  Loading:  {BEST_PT}")
    model = YOLO(str(BEST_PT))

    print("🔄  Exporting to ONNX…")
    exported_path = model.export(
        format     = "onnx",
        imgsz      = 640,
        dynamic    = False,   # fixed input shape for consistent Node.js inference
        simplify   = True,    # simplify ONNX graph for faster inference
        opset      = 12,      # onnxruntime-node compatibility
    )

    # YOLOv8 export() saves next to the .pt file — move to server/model/
    src = Path(exported_path)
    shutil.copy2(src, ONNX_OUT)
    print(f"\n✅  ONNX model exported → {ONNX_OUT}")
    print(f"   File size: {ONNX_OUT.stat().st_size / 1024 / 1024:.1f} MB")

    # Write class labels file for the Node.js service
    classes_path = MODEL_OUT / "classes.json"
    import json
    classes_info = {
        "classes": ["Muddy-Floor", "Uncleaned-Floor", "Stain", "Rusty-Pipes"],
        "penalties": {
            "Muddy-Floor":     25,
            "Uncleaned-Floor": 20,
            "Stain":           10,
            "Rusty-Pipes":     0
        },
        "conf_threshold": 0.35,
        "iou_threshold":  0.45,
        "model_version":  "1.0",
        "input_size":     640
    }
    classes_path.write_text(json.dumps(classes_info, indent=2))
    print(f"   Class config → {classes_path}")

    print("\n▶  Next step:  npm install onnxruntime-node  (in project root)")
    print("   The Express server will automatically load the model on startup.\n")


if __name__ == "__main__":
    export()
