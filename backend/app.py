"""
CleanVision Flask Backend
Hospital cleanliness monitoring API.
"""

import os
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

import database
import model

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# CORS configuration
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', '*')
if ALLOWED_ORIGINS == '*':
    CORS(app)
else:
    CORS(app, origins=ALLOWED_ORIGINS.split(','))

# Upload configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
BASELINES_FOLDER = os.path.join(UPLOAD_FOLDER, 'baselines')
SCANS_FOLDER = os.path.join(UPLOAD_FOLDER, 'scans')

# Allowed image extensions
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}


def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def ensure_upload_dirs():
    """Ensure upload directories exist."""
    os.makedirs(BASELINES_FOLDER, exist_ok=True)
    os.makedirs(SCANS_FOLDER, exist_ok=True)


# Initialize database and ensure directories on startup
with app.app_context():
    database.init_db()
    ensure_upload_dirs()


# ==================== API ROUTES ====================

@app.route('/api/rooms', methods=['POST'])
def create_room():
    """Create a new room with name and block."""
    try:
        name = request.form.get('name')
        block = request.form.get('block')
        
        if not name:
            return jsonify({'error': 'Room name is required'}), 400
        if not block:
            return jsonify({'error': 'Block is required'}), 400
        
        room_id = database.add_room(name, block)
        return jsonify({'success': True, 'room_id': room_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    """Get all rooms with their latest scan info."""
    try:
        rooms = database.get_all_rooms()
        return jsonify({'rooms': rooms}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/rooms/<int:room_id>', methods=['GET'])
def get_room(room_id):
    """Get a single room by ID."""
    try:
        room = database.get_room(room_id)
        if room is None:
            return jsonify({'error': 'Room not found'}), 404
        return jsonify({'room': room}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/rooms/<int:room_id>/baseline', methods=['POST'])
def upload_baseline(room_id):
    """Upload a baseline image for a room."""
    try:
        # Check if room exists
        room = database.get_room(room_id)
        if room is None:
            return jsonify({'error': 'Room not found'}), 404
        
        # Check if file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        # Validate file extension
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Allowed: jpg, jpeg, png, webp'}), 400
        
        # Secure filename and save
        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[1].lower()
        save_filename = f"{room_id}_baseline.{ext}"
        save_path = os.path.join(BASELINES_FOLDER, save_filename)
        file.save(save_path)
        
        # Update database with relative path
        relative_path = f"uploads/baselines/{save_filename}"
        database.set_baseline(room_id, relative_path)
        
        return jsonify({'success': True, 'image_path': relative_path}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/scan', methods=['POST'])
def scan_image():
    """Upload a scan image and get cleanliness prediction."""
    try:
        # Get room_id from form
        room_id_str = request.form.get('room_id')
        if not room_id_str:
            return jsonify({'error': 'room_id is required'}), 400
        
        try:
            room_id = int(room_id_str)
        except ValueError:
            return jsonify({'error': 'Invalid room_id'}), 400
        
        # Check if room exists
        room = database.get_room(room_id)
        if room is None:
            return jsonify({'error': 'Room not found'}), 404
        
        # Check if file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image file selected'}), 400
        
        # Validate file extension
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Allowed: jpg, jpeg, png, webp'}), 400
        
        # Save the scan image
        filename = secure_filename(file.filename)
        ext = filename.rsplit('.', 1)[1].lower()
        timestamp = int(time.time())
        save_filename = f"{room_id}_{timestamp}.{ext}"
        save_path = os.path.join(SCANS_FOLDER, save_filename)
        file.save(save_path)
        
        # Run prediction
        prediction = model.predict(save_path)
        
        # Save scan to database
        relative_path = f"uploads/scans/{save_filename}"
        database.add_scan(room_id, relative_path, prediction['score'], prediction['status'])
        
        return jsonify({
            'score': prediction['score'],
            'status': prediction['status'],
            'room_id': room_id,
            'mock': prediction['mock']
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/rooms/<int:room_id>/history', methods=['GET'])
def get_history(room_id):
    """Get scan history for a room."""
    try:
        # Check if room exists
        room = database.get_room(room_id)
        if room is None:
            return jsonify({'error': 'Room not found'}), 404
        
        limit = request.args.get('limit', 10, type=int)
        history = database.get_scan_history(room_id, limit)
        return jsonify({'history': history}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'mock_mode': model.MOCK_MODE
    }), 200


# ==================== STATIC FILE SERVING ====================
# Serve the built React app in production

FRONTEND_BUILD = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build')


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve the React frontend build."""
    if path and os.path.exists(os.path.join(FRONTEND_BUILD, path)):
        return send_from_directory(FRONTEND_BUILD, path)
    index_path = os.path.join(FRONTEND_BUILD, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(FRONTEND_BUILD, 'index.html')
    return jsonify({
        'status': 'CleanVision API running',
        'note': 'frontend build not found'
    }), 200


# ==================== MAIN ====================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)