import { useState, useEffect, useRef } from 'react';
import { FiSend, FiRefreshCw, FiMessageSquare } from 'react-icons/fi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama2');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch available models when component mounts
    fetch('http://localhost:8080/models')
      .then(res => res.json())
      .then(data => {
        const modelNames = data.models?.map((model: any) => model.name) || [];
        setModels(modelNames);
        if (modelNames.length > 0) {
          setSelectedModel(modelNames[0]);
        }
      })
      .catch(err => console.error('Failed to fetch models:', err));
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const messageHistory = [...messages, userMessage];
    
    try {
      const eventSource = new EventSource(`http://localhost:8080/chat?${new URLSearchParams({
        model: selectedModel,
        messages: JSON.stringify(messageHistory)
      })}`);

      let assistantMessage = { role: 'assistant' as const, content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        assistantMessage.content += data.content;
        setMessages(prev => [...prev.slice(0, -1), { ...assistantMessage }]);
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        setIsLoading(false);
      };

      eventSource.addEventListener('done', () => {
        eventSource.close();
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <header className="bg-gray-800/50 border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold gradient-text">HyprNoon AI</h1>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
      </header>
      
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 overflow-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`message-bubble ${message.role} animate-fade-in`}>
                <div className="flex items-start gap-2">
                  {message.role === 'user' ? (
                    <FiMessageSquare className="mt-1 text-white" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
                      AI
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <div className="glass-panel rounded-full p-3">
                <FiRefreshCw className="animate-spin text-indigo-400 w-6 h-6" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-gray-800/50 border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="gradient-button"
          >
            {isLoading ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <FiSend />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
