from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import os
import re
import uuid
import urllib.parse
import requests # Make sure requests is imported for thumbnail checks

app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for all routes

# Database initialization
def init_db():
    conn = sqlite3.connect('thumbnails.db')
    cursor = conn.cursor()

    # Create boards table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Create thumbnails table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS thumbnails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        board_id TEXT NOT NULL,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT NOT NULL,
        title TEXT,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE CASCADE
    )
    ''')

    conn.commit()
    conn.close()

# Extract video ID from YouTube URL
def extract_video_id(url):
    # Handle different YouTube URL formats, including /live/ paths for ended streams
    youtube_regex = r'(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|live\/|)([a-zA-Z0-9_-]{11})(?:\S+)?'
    youtube_match = re.search(youtube_regex, url)

    if youtube_match:
        return youtube_match.group(1)
    return None

# NEW HELPER: Function to get the highest quality available YouTube thumbnail URL
def get_highest_quality_thumbnail_url(video_id):
    # Order from highest to lowest quality
    qualities = ["maxresdefault.jpg", "sddefault.jpg", "hqdefault.jpg", "mqdefault.jpg", "default.jpg"]
    # Use the official YouTube thumbnail domain and HTTPS
    base_url = f"https://i.ytimg.com/vi/{video_id}/"

    for quality in qualities:
        full_url = base_url + quality
        try:
            # Use requests.head() for efficiency - only checks headers, doesn't download full image
            response = requests.head(full_url, timeout=5) # Added timeout for robustness
            if response.status_code == 200:
                return full_url
        except requests.exceptions.RequestException as e:
            # Print error for debugging, but continue trying other qualities
            print(f"Could not check {full_url}: {e}")
            continue # Try next quality if there's a request error

    # If no valid thumbnail is found after trying all qualities
    return None # Or you could return a path to a generic 'no-thumbnail.png' if you have one


# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# API Routes
@app.route('/api/boards', methods=['GET'])
def get_boards():
    conn = sqlite3.connect('thumbnails.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM boards ORDER BY created_at DESC') # Or use ASC for oldest first
    boards = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(boards)

@app.route('/api/boards', methods=['POST'])
def create_board():
    data = request.json
    board_name = data.get('name', 'Untitled Board')

    if not board_name.strip():
        return jsonify({'error': 'Board name cannot be empty'}), 400

    board_id = str(uuid.uuid4())

    conn = sqlite3.connect('thumbnails.db')
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT INTO boards (id, name) VALUES (?, ?)', (board_id, board_name))
        conn.commit()
        conn.close()
        return jsonify({'id': board_id, 'name': board_name}), 201
    except sqlite3.Error as e:
        conn.close()
        return jsonify({'error': f'Database error: {str(e)}'}), 500

@app.route('/api/boards/<board_id>', methods=['GET'])
def get_board(board_id):
    conn = sqlite3.connect('thumbnails.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get board details
    cursor.execute('SELECT * FROM boards WHERE id = ?', (board_id,))
    board = dict(cursor.fetchone() or {})

    if not board:
        conn.close()
        return jsonify({'error': 'Board not found'}), 404

    # Get thumbnails for this board
    cursor.execute('SELECT * FROM thumbnails WHERE board_id = ? ORDER BY added_at DESC', (board_id,))
    thumbnails = [dict(row) for row in cursor.fetchall()]

    board['thumbnails'] = thumbnails
    conn.close()

    return jsonify(board)

@app.route('/api/boards/<board_id>', methods=['PUT'])
def update_board(board_id):
    data = request.json
    new_name = data.get('name', '').strip()

    if not new_name:
        return jsonify({'error': 'Board name cannot be empty'}), 400

    conn = sqlite3.connect('thumbnails.db')
    cursor = conn.cursor()
    cursor.execute('UPDATE boards SET name = ? WHERE id = ?', (new_name, board_id))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()

    if rows_affected == 0:
        return jsonify({'error': 'Board not found'}), 404

    return jsonify({'id': board_id, 'name': new_name}), 200

@app.route('/api/boards/<board_id>', methods=['DELETE'])
def delete_board(board_id):
    conn = sqlite3.connect('thumbnails.db')
    cursor = conn.cursor()
    # Delete associated thumbnails first (due to FOREIGN KEY ON DELETE CASCADE if set up, but explicit deletion is safer)
    cursor.execute('DELETE FROM thumbnails WHERE board_id = ?', (board_id,))
    cursor.execute('DELETE FROM boards WHERE id = ?', (board_id,))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()

    if rows_affected == 0:
        return jsonify({'error': 'Board not found'}), 404

    return jsonify({'success': True, 'message': 'Board and its thumbnails deleted successfully'}), 200


@app.route('/api/boards/<board_id>/thumbnails', methods=['POST'])
def add_thumbnail_api(board_id):
    data = request.json
    video_url = data.get('video_url', '')

    video_id = extract_video_id(video_url)
    if not video_id:
        return jsonify({'error': 'Invalid YouTube URL or video ID not found'}), 400

    # Use the new helper function to get the highest quality thumbnail
    thumbnail_url = get_highest_quality_thumbnail_url(video_id)
    if not thumbnail_url:
        return jsonify({'error': 'Unable to retrieve any thumbnail for video'}), 400

    title = data.get('title', 'Untitled Video') # Frontend currently doesn't send title, but good to have

    conn = sqlite3.connect('thumbnails.db')
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT INTO thumbnails (board_id, video_url, thumbnail_url, title) VALUES (?, ?, ?, ?)',
                        (board_id, video_url, thumbnail_url, title))
        conn.commit()
        thumbnail_id = cursor.lastrowid
        conn.close()

        return jsonify({
            'id': thumbnail_id,
            'video_url': video_url,
            'thumbnail_url': thumbnail_url,
            'title': title,
            'board_id': board_id # Include board_id for context
        }), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Board not found, cannot add thumbnail'}), 404
    except sqlite3.Error as e:
        conn.close()
        return jsonify({'error': f'Database error: {str(e)}'}), 500


@app.route('/api/boards/<board_id>/thumbnails/<thumbnail_id>', methods=['DELETE'])
def delete_thumbnail(board_id, thumbnail_id):
    conn = sqlite3.connect('thumbnails.db')
    cursor = conn.cursor()
    cursor.execute('DELETE FROM thumbnails WHERE id = ? AND board_id = ?', (thumbnail_id, board_id))
    conn.commit()
    rows_affected = cursor.rowcount
    conn.close()

    if rows_affected == 0:
        return jsonify({'error': 'Thumbnail not found or does not belong to this board'}), 404

    return jsonify({'success': True, 'message': 'Thumbnail deleted successfully'}), 200

# This route serves the same index.html but allows for direct linking to a board
@app.route('/board/<board_id>')
def shared_board(board_id):
    return render_template('index.html')

if __name__ == '__main__':
    init_db() # Ensure the database is initialized
    app.run(debug=True, host='0.0.0.0', port=5000)
