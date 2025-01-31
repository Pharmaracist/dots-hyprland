from flask import Flask, request, Response, stream_with_context
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)

OLLAMA_API_BASE = "http://localhost:11434"

@app.route("/models", methods=["GET"])
def list_models():
    response = requests.get(f"{OLLAMA_API_BASE}/api/tags")
    return response.json()

@app.route("/chat", methods=["GET"])
def chat():
    model = request.args.get("model", "llama2")
    messages = json.loads(request.args.get("messages", "[]"))
    
    def generate():
        # Convert messages to Ollama format
        conversation = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "assistant"
            conversation.append({"role": role, "content": msg["content"]})
        
        response = requests.post(
            f"{OLLAMA_API_BASE}/api/chat",
            json={
                "model": model,
                "messages": conversation,
                "stream": True
            },
            stream=True
        )
        
        for line in response.iter_lines():
            if line:
                try:
                    data = json.loads(line)
                    if "message" in data:
                        content = data["message"].get("content", "")
                        yield f"data: {json.dumps({'content': content})}\n\n"
                    if data.get("done", False):
                        break
                except json.JSONDecodeError:
                    continue
    
    return Response(stream_with_context(generate()), mimetype="text/event-stream")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)
