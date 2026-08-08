"""
CleanVision Model Module — Production hardener & probability calibrator.
Handles AI model loading, MobileNetV2 input preprocessing, isotonic probability calibration,
and status threshold mapping.

Falls back to deterministic mock mode if cleanliness_model.h5 is not present.
Lazy loads TensorFlow on demand so server startup is instantaneous.
"""

import hashlib
import os

# Global flags and model reference
MOCK_MODE: bool = True
_model = None
_calibrator = None
_model_attempted_load: bool = False

MODEL_PATH = os.path.join(os.path.dirname(__file__), "cleanliness_model.h5")
CALIBRATOR_PATH = os.path.join(os.path.dirname(__file__), "calibrator.pkl")


def load_model_if_needed():
    """Lazy-load MobileNetV2 model and calibrator on demand to keep server startup fast."""
    global _model, _calibrator, MOCK_MODE, _model_attempted_load

    if _model_attempted_load:
        return

    _model_attempted_load = True

    if not os.path.exists(MODEL_PATH):
        print("[CleanVision AI] No trained model found at backend/cleanliness_model.h5 — MOCK MODE active.")
        MOCK_MODE = True
        return

    try:
        print("[CleanVision AI] Loading TensorFlow and MobileNetV2 model...")
        import tensorflow as tf
        _model = tf.keras.models.load_model(MODEL_PATH)
        MOCK_MODE = False
        print("[CleanVision AI] Trained MobileNetV2 model loaded successfully.")

        if os.path.exists(CALIBRATOR_PATH):
            import pickle
            with open(CALIBRATOR_PATH, "rb") as f:
                _calibrator = pickle.load(f)
            print("[CleanVision AI] Isotonic probability calibrator loaded successfully.")
        else:
            print("[CleanVision AI] Calibrator file calibrator.pkl not found — using direct sigmoid mapping.")
    except Exception as exc:
        print(f"[CleanVision AI] Model load error: {exc}")
        print("[CleanVision AI] Running in MOCK MODE fallback.")
        MOCK_MODE = True


# Check if model file exists without loading TensorFlow yet
if os.path.exists(MODEL_PATH):
    MOCK_MODE = False
else:
    MOCK_MODE = True


# --------------------------------------------------------------------------- #
# Status Threshold Mapping                                                      #
# --------------------------------------------------------------------------- #

def get_status(score: float) -> str:
    """Map a 0.0–100.0 cleanliness score to a facility operational status string."""
    if score >= 75.0:
        return "clean"
    if score >= 55.0:
        return "needs_attention"
    return "dirty"


def calculate_score(pred_raw: float) -> float:
    """Calculate a calibrated 0.0–100.0 cleanliness score from raw sigmoid P(dirty)."""
    if _calibrator is not None:
        try:
            pred_calibrated = float(_calibrator.predict([pred_raw])[0])
        except Exception:
            pred_calibrated = pred_raw
    else:
        pred_calibrated = pred_raw

    score = round((1.0 - pred_calibrated) * 100.0, 1)
    return max(0.0, min(100.0, score))


# --------------------------------------------------------------------------- #
# Inference Entry Points                                                        #
# --------------------------------------------------------------------------- #

def predict(image_path: str) -> dict:
    """Return a cleanliness prediction for an image file."""
    load_model_if_needed()
    if MOCK_MODE or _model is None:
        return _mock_predict(image_path)
    return _real_predict(image_path)


def _mock_predict(image_path: str) -> dict:
    """Deterministic hash-based prediction for UI testing without model file."""
    with open(image_path, "rb") as fh:
        digest = hashlib.md5(fh.read()).hexdigest()

    raw = int(digest[:8], 16)
    score = round((raw % 1000) / 10.0, 1)

    return {"score": score, "status": get_status(score), "mock": True}


def _real_predict(image_path: str) -> dict:
    """Run inference with MobileNetV2 preprocessed tensor and probability calibrator."""
    from PIL import Image
    import numpy as np

    img = Image.open(image_path).convert("RGB")
    img = img.resize((224, 224), Image.LANCZOS)

    # MobileNetV2 Preprocessing: (x / 127.5) - 1.0 -> maps [0, 255] to [-1, 1]
    arr = (np.array(img, dtype="float32") / 127.5) - 1.0
    img_array = np.expand_dims(arr, axis=0)

    pred_raw = float(_model.predict(img_array, verbose=0)[0][0])
    score = calculate_score(pred_raw)

    return {"score": score, "status": get_status(score), "mock": False}