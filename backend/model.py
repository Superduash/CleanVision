"""
CleanVision Model Module
Handles AI model loading and predictions.
Falls back to mock mode if trained model is not available.
"""

import os
import hashlib
from PIL import Image
import numpy as np

# Global flags and model reference
MOCK_MODE = True
model = None

# Path to the trained model file
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'cleanliness_model.h5')

# Attempt to load the trained model
try:
    import tensorflow as tf
    from tensorflow import keras
    
    if os.path.exists(MODEL_PATH):
        model = keras.models.load_model(MODEL_PATH)
        MOCK_MODE = False
        print("[CleanVision] Trained model loaded successfully.")
    else:
        print("[CleanVision] No trained model found — running in MOCK MODE. Predictions are randomized for testing only.")
except Exception as e:
    print(f"[CleanVision] Failed to load model: {e}")
    print("[CleanVision] Running in MOCK MODE. Predictions are randomized for testing only.")
    MOCK_MODE = True


def get_status_from_score(score):
    """
    Determine cleanliness status from score.
    Thresholds:
        >= 70: clean
        40-69: needs_attention
        < 40: dirty
    """
    if score >= 70:
        return 'clean'
    elif score >= 40:
        return 'needs_attention'
    else:
        return 'dirty'


def predict(image_path):
    """
    Predict cleanliness score for an image.
    
    Returns:
        dict with keys:
            - score: float 0-100, one decimal
            - status: 'clean' | 'needs_attention' | 'dirty'
            - mock: bool indicating if prediction is from mock mode
    
    Note on class mapping:
        This code assumes the model was trained with:
            class_indices = {'clean': 0, 'dirty': 1}
        So model output is P(dirty), and score = (1 - prediction) * 100.
        
        IMPORTANT: Verify this against the actual class_indices printed during
        Colab training. If your training shows {'dirty': 0, 'clean': 1}, 
        flip the formula to: score = prediction * 100
    """
    if MOCK_MODE:
        # Mock mode: generate stable pseudo-random score from image hash
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
        hash_value = int(hashlib.md5(image_bytes).hexdigest(), 16)
        score = round(hash_value % 100, 1)
        status = get_status_from_score(score)
        return {
            'score': score,
            'status': status,
            'mock': True
        }
    else:
        # Real mode: use the trained model
        # Open image, convert to RGB, resize to 224x224
        img = Image.open(image_path).convert('RGB')
        img = img.resize((224, 224))
        
        # Convert to numpy array and normalize
        img_array = np.array(img) / 255.0
        
        # Expand dimensions for batch (1, 224, 224, 3)
        img_array = np.expand_dims(img_array, axis=0)
        
        # Run prediction
        prediction = model.predict(img_array, verbose=0)
        
        # Take scalar output (P(dirty) based on assumed class mapping)
        pred_value = float(prediction[0][0])
        
        # Calculate cleanliness score: (1 - P(dirty)) * 100
        score = round((1 - pred_value) * 100, 1)
        
        # Clamp score to 0-100 range
        score = max(0.0, min(100.0, score))
        
        status = get_status_from_score(score)
        
        return {
            'score': score,
            'status': status,
            'mock': False
        }