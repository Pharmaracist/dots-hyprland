#!/usr/bin/env python3
import sys
import json
import os
import traceback
from ytmusicapi import YTMusic

def search_songs(query):
    try:
        # Initialize YTMusic without auth first
        try:
            ytmusic = YTMusic()
            print(f"Debug: YTMusic initialized without auth", file=sys.stderr)
        except Exception as e:
            print(f"Debug: Failed to initialize without auth: {e}", file=sys.stderr)
            # Try with browser.json from home directory as fallback
            auth_path = os.path.expanduser("~/browser.json")
            if os.path.exists(auth_path):
                try:
                    ytmusic = YTMusic(auth_path)
                    print(f"Debug: YTMusic initialized with auth file", file=sys.stderr)
                except Exception as e:
                    error = {
                        "error": f"Failed to initialize YTMusic: {str(e)}"
                    }
                    print(json.dumps(error))
                    return
            else:
                error = {
                    "error": "Failed to initialize YTMusic. If you need authenticated features, run 'ytmusicapi browser' in your terminal."
                }
                print(json.dumps(error))
                return
        
        print(f"Debug: Searching for: {query}", file=sys.stderr)
        
        try:
            results = ytmusic.search(query, filter="songs", limit=10)
            print(f"Debug: Got {len(results)} results", file=sys.stderr)
        except Exception as e:
            error = {
                "error": f"Search failed: {str(e)}"
            }
            print(json.dumps(error))
            return
        
        # Convert results to a simpler format
        simplified_results = []
        for item in results:
            try:
                if isinstance(item, dict) and item.get('resultType') == 'song':
                    simplified_results.append({
                        'videoId': item.get('videoId', ''),
                        'title': item.get('title', 'Unknown Title'),
                        'artists': item.get('artists', [{'name': 'Unknown Artist'}]),
                        'album': item.get('album', {}).get('name', '')
                    })
            except Exception as e:
                print(f"Debug: Error processing item: {str(e)}", file=sys.stderr)
                print(f"Debug: Item was: {item}", file=sys.stderr)
        
        if not simplified_results:
            error = {
                "error": "No songs found in search results"
            }
            print(json.dumps(error))
            return
            
        print(f"Debug: Simplified {len(simplified_results)} results", file=sys.stderr)
        print(json.dumps(simplified_results, ensure_ascii=False))
        
    except Exception as e:
        error = {
            "error": f"Unexpected error: {str(e)}\n{traceback.format_exc()}"
        }
        print(json.dumps(error))

if __name__ == '__main__':
    if len(sys.argv) > 1:
        search_songs(sys.argv[1])
    else:
        print(json.dumps({"error": "No search query provided"}))
