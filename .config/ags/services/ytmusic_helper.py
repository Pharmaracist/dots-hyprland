#!/usr/bin/env python3
import sys
import json
import os
import traceback
from ytmusicapi import YTMusic

def init_ytmusic():
    """Initialize YTMusic with or without authentication."""
    try:
        # Try to use cached instance first
        if hasattr(init_ytmusic, '_instance'):
            return init_ytmusic._instance

        ytmusic = YTMusic()
        init_ytmusic._instance = ytmusic
        return ytmusic
    except Exception as e:
        print(f"Debug: Failed to initialize YTMusic: {e}", file=sys.stderr)
        return None

def get_track_info(video_id):
    """Get track info from YouTube Music."""
    ytmusic = init_ytmusic()
    if not ytmusic:
        return json.dumps({"error": "Failed to initialize YTMusic"})

    try:
        # Use watch playlist for faster info retrieval
        watch_info = ytmusic.get_watch_playlist(video_id)
        if watch_info and 'tracks' in watch_info and watch_info['tracks']:
            track = watch_info['tracks'][0]
            
            # Only include essential fields
            info = {
                'videoId': video_id,
                'title': track.get('title', 'Unknown Title'),
                'artists': [{'name': a.get('name', 'Unknown Artist')} for a in track.get('artists', [])],
                'thumbnail': next((t.get('url', '') for t in reversed(track.get('thumbnails', []))), '')
            }
            print(json.dumps(info))
            return

        # Fallback to song info if watch playlist fails
        track = ytmusic.get_song(video_id)
        if not track:
            print(json.dumps({"error": "Track not found"}))
            return

        info = {
            'videoId': video_id,
            'title': track.get('title', 'Unknown Title'),
            'artists': [{'name': a.get('name', 'Unknown Artist')} for a in track.get('artists', [])],
            'thumbnail': next((t.get('url', '') for t in reversed(track.get('thumbnails', []))), '')
        }
        print(json.dumps(info))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)

def search_songs(query):
    """Search for songs on YouTube Music."""
    ytmusic = init_ytmusic()
    if not ytmusic:
        return json.dumps({"error": "Failed to initialize YTMusic"})

    try:
        # Optimize search by limiting fields and results
        results = ytmusic.search(query, filter="songs", limit=20)
        tracks = []
        
        for result in results:
            if result['resultType'] != 'song' or not result.get('videoId'):
                continue
                
            # Only include essential fields
            track = {
                'videoId': result['videoId'],
                'title': result.get('title', 'Unknown Title'),
                'artists': [{'name': a.get('name', 'Unknown Artist')} for a in result.get('artists', [])],
                'thumbnail': next((t.get('url', '') for t in reversed(result.get('thumbnails', []))), '')
            }
            tracks.append(track)
            
            if len(tracks) >= 10:  # Limit to 10 results for better performance
                break
            
        print(json.dumps(tracks))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)

def get_radio(video_id, limit=5):
    """Get radio (similar tracks) for a given video ID."""
    ytmusic = init_ytmusic()
    if not ytmusic:
        error = {
            "error": "Failed to initialize YTMusic"
        }
        print(json.dumps(error))
        return

    try:
        # Get radio playlist
        radio = ytmusic.get_watch_playlist(video_id, limit=int(limit))
        if not radio or 'tracks' not in radio:
            return []

        # Format tracks
        tracks = []
        for track in radio['tracks']:
            if track.get('videoId') == video_id:
                continue
            
            tracks.append({
                'videoId': track.get('videoId'),
                'title': track.get('title'),
                'artists': [{'name': a.get('name')} for a in track.get('artists', [])],
                'album': track.get('album', {}).get('name', ''),
                'thumbnail': track.get('thumbnails', [{}])[-1].get('url', ''),
            })

        return tracks[:int(limit)]
    except Exception as e:
        print(f"Error getting radio: {e}", file=sys.stderr)
        return []

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: ytmusic_helper.py <command> [args...]")
        sys.exit(1)

    command = sys.argv[1]
    if command == 'search':
        search_songs(' '.join(sys.argv[2:]))
    elif command == 'get_track_info':
        get_track_info(sys.argv[2])
    elif command == 'get_radio':
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else 5
        tracks = get_radio(sys.argv[2], limit)
        print(json.dumps(tracks))
    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)
