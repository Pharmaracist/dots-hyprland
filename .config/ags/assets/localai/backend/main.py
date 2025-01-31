from flask import Flask, request, Response, stream_with_context
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)

OLLAMA_API = "http://localhost:11434/api/chat"

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    
    def generate():
        response = requests.post(
            OLLAMA_API,
            json={
                "model": data.get("model", "llama2"),
                "messages": data["messages"],
                "stream": True
            },
            stream=True
        )
        
        for line in response.iter_lines():
            if line:
                try:
                    response_data = json.loads(line)
                    if "message" in response_data:
                        yield f"data: {json.dumps({
                            'content': response_data['message']['content'],
                            'done': response_data.get('done', False)
                        })}\n\n"
                except json.JSONDecodeError:
                    continue
    
    return Response(stream_with_context(generate()), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
