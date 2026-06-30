"""
CleanVision Model Module
Handles AI model loading and predictions.
Falls back to deterministic mock mode if the trained model is not available.
"""

import hashlib
import os

# Global flags and model reference
MOCK_MODE: bool = True
_model = None

MODEL_PATH = os.path.join(os.path.dirname(__file__), "cleanliness_model.h5")

try:
    import tensorflow as tf
    from tensorflow import keras  # noqa: F401 (imported so keras is available below)

    if os.path.exists(MODEL_PATH):
        _model = tf.keras.models.load_model(MODEL_PATH)
        MOCK_MODE = False
        print("[CleanVision] Trained model loaded successfully.")
    else:
        print(
            "[CleanVision] No trained model found — running in MOCK MODE. "
            "Predictions are hash-based and stable, but not real AI. "
            "Drop cleanliness_model.h5 into the backend/ directory and restart to use real inference."
        )
except Exception as exc:
    print(f"[CleanVision] Model load error: {exc}")
    print("[CleanVision] Running in MOCK MODE — predictions are hash-based for testing only.")
    MOCK_MODE = True


# --------------------------------------------------------------------------- #
# Shared business logic                                                         #
# --------------------------------------------------------------------------- #

def get_status(score: float) -> str:
    """
    Map a 0–100 cleanliness score to a status string.

    Thresholds (defined in spec):
        >= 70  → 'clean'
        40–69  → 'needs_attention'
        <  40  → 'dirty'
    """
    if score >= 70:
        return "clean"
    if score >= 40:
        return "needs_attention"
    return "dirty"


# --------------------------------------------------------------------------- #
# Prediction                                                                    #
# --------------------------------------------------------------------------- #

def predict(image_path: str) -> dict:
    """
    Return a cleanliness prediction for an image.

    Returns:
        {
            "score":  float   — 0.0–100.0, one decimal place
            "status": str     — 'clean' | 'needs_attention' | 'dirty'
            "mock":   bool    — True when running without a trained model
        }

    Real-mode class mapping assumption:
        class_indices = {'clean': 0, 'dirty': 1}
        model output  = P(dirty)
        score         = round((1 - P(dirty)) * 100, 1)

    IMPORTANT: Verify this against the class_indices printed during Colab
    training.  If your notebook prints {'dirty': 0, 'clean': 1}, change
    the formula to: score = round(pred_value * 100, 1)
    """
    if MOCK_MODE:
        return _mock_predict(image_path)
    return _real_predict(image_path)


def _mock_predict(image_path: str) -> dict:
    """
    Deterministic mock prediction based on the MD5 hash of the image bytes.
    The same image file always produces the same score — useful for manual
    testing without a trained model.
    """
    with open(image_path, "rb") as fh:
        digest = hashlib.md5(fh.read()).hexdigest()

    # Use the first 8 hex chars as an integer base for the score (0–99).
    # Divide by 10 to get one decimal place while keeping the range 0–99.
    raw = int(digest[:8], 16)
    # Map to 0.0–99.9 with one decimal
    score = round((raw % 1000) / 10.0, 1)

    return {"score": score, "status": get_status(score), "mock": True}


def _real_predict(image_path: str) -> dict:
    """Run inference with the trained MobileNetV2 model."""
    from PIL import Image
    import numpy as np

    img = Image.open(image_path).convert("RGB")
    img = img.resize((224, 224), Image.LANCZOS)
    img_array = np.expand_dims(np.array(img, dtype="float32") / 255.0, axis=0)

    pred_value = float(_model.predict(img_array, verbose=0)[0][0])
    score = round((1.0 - pred_value) * 100.0, 1)
    score = max(0.0, min(100.0, score))

    return {"score": score, "status": get_status(score), "mock": False}