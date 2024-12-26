import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup?version=3.0';
import { fileExists } from '../modules/.miscutils/files.js';

const HISTORY_DIR = `${GLib.get_user_state_dir()}/ags/user/ai/chats/`;
const HISTORY_FILENAME = `gemini.txt`;
const HISTORY_PATH = `${HISTORY_DIR}${HISTORY_FILENAME}`;
const CUSTOM_PROMPT_FILE = `${GLib.get_user_state_dir()}/ags/user/ai/custom_prompt.txt`;
const CUSTOM_PROMPT_FILE_PATH = `${GLib.get_user_state_dir()}/ags/user/ai/custom_prompt.txt`;
const initMessages = [];

const KEY_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/ai/google_key.txt`;
const APIDOM_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/ai/google_api_dom.txt`;
function replaceapidom(URL) {
    if (fileExists(APIDOM_FILE_LOCATION)) {
        var contents = Utils.readFile(APIDOM_FILE_LOCATION).trim();
        var URL = URL.toString().replace("generativelanguage.googleapis.com", contents);
    }
    return URL;
}
const CHAT_MODELS = ["gemini-pro", "gemini-pro"];
const ONE_CYCLE_COUNT = 1;

class GeminiMessage extends Service {
    static {
        Service.register(this,
            {
                'delta': ['string'],
            },
            {
                'content': ['string'],
                'thinking': ['boolean'],
                'done': ['boolean'],
                'hasImage': ['boolean'],
            });
    }

    _role = '';
    _parts = [];
    _thinking;
    _done = false;
    _rawData = '';
    _hasImage = false;

    constructor(role, content, thinking = true, done = false, imageData = null) {
        super();
        this._role = role;
        if (imageData) {
            this._parts = [
                { text: content },
                { inlineData: { mimeType: 'image/jpeg', data: imageData } }
            ];
            this._hasImage = true;
        } else {
            this._parts = [{ text: content }];
        }
        this._thinking = thinking;
        this._done = done;
    }

    get rawData() { return this._rawData }
    set rawData(value) { this._rawData = value }

    get done() { return this._done }
    set done(isDone) { this._done = isDone; this.notify('done') }

    get role() { return this._role }
    set role(role) { this._role = role; this.emit('changed') }

    get content() { return this._parts[0].text }
    set content(content) {
        if (this._hasImage) {
            this._parts[0].text = content;
        } else {
            this._parts = [{ text: content }];
        }
        this.notify('content');
        this.emit('changed');
    }

    get parts() { return this._parts }
    get hasImage() { return this._hasImage }

    get thinking() { return this._thinking }
    set thinking(value) {
        this._thinking = value;
        this.notify('thinking');
        this.emit('changed');
    }

    addDelta(delta) {
        if (this.thinking) {
            this.thinking = false;
            this.content = delta;
        } else {
            this.content = this.content + delta;
        }
        this.emit('delta', delta);
    }

    parseSection() {
        if (this._thinking) {
            this.thinking = false;
            if (!this._hasImage) {
                this._parts[0].text = '';
            }
        }
        try {
            const parsedData = JSON.parse(this._rawData);
            if (!parsedData.candidates) {
                this._parts[0].text += `Error: ${parsedData.promptFeedback?.blockReason || 'Unknown error'}`;
            } else {
                const delta = parsedData.candidates[0].content.parts[0].text;
                this._parts[0].text += delta;
            }
            this.notify('content');
        } catch (error) {
            this._parts[0].text += 'Error parsing response';
            this.notify('content');
        }
        this._rawData = '';
    }
}

class GeminiService extends Service {
    static {
        Service.register(this, {
            'initialized': [],
            'clear': [],
            'newMsg': ['int'],
            'hasKey': ['boolean'],
            'imageProcessing': ['boolean'],
        });
    }

    _assistantPrompt = userOptions.asyncGet().ai.enhancements;
    _cycleModels = true;
    _usingHistory = true; // Enable history by default
    _key = '';
    _requestCount = 0;
    _safe = userOptions.asyncGet().ai.safety;
    _temperature = userOptions.asyncGet().ai.defaultTemperature;
    _messages = [];
    _modelIndex = 0;
    _decoder = new TextDecoder();
    _processingImage = false;
    _customPrompt = '';

    constructor() {
        super();

        this._key = '';
        this._messages = [];
        this._modelIndex = 0;
        this._requestCount = 0;
        this._temperature = 0.7;
        this._safe = true;
        this._cycleModels = false;
        this._usingHistory = true;
        this._customPrompt = '';

        // Load custom prompt first
        this.loadCustomPrompt();

        // Then initialize messages
        this._messages = this.getInitialMessages();

        // Finally load history if it exists
        if (this._usingHistory) {
            this.loadHistory();
        }

        if (fileExists(KEY_FILE_LOCATION)) this._key = Utils.readFile(KEY_FILE_LOCATION).trim();
        else this.emit('hasKey', false);

        this.emit('initialized');
    }

    getInitialMessages() {
        // Always start with the base system prompt
        let messages = [
            { 
                role: "user", 
                parts: [{ 
                    text: "You are an assistant on a sidebar of a Wayland Linux desktop. Please always use a casual tone when answering your questions, unless requested otherwise or making writing suggestions. These are the steps you should take to respond to the user's queries:\n1. If it's a writing- or grammar-related question or a sentence in quotation marks, Please point out errors and correct when necessary using underlines, and make the writing more natural where appropriate without making too major changes. If you're given a sentence in quotes but is grammatically correct, explain briefly concepts that are uncommon.\n2. If it's a question about system tasks, give a bash command in a code block with brief explanation.\n3. Otherwise, when asked to summarize information or explaining concepts, you are should use bullet points and headings. For mathematics expressions, you *have to* use LaTeX within a code block with the language set as \"latex\". \nNote: Use casual language, be short, while ensuring the factual correctness of your response. If you are unsure or don't have enough information to provide a confident answer, simply say \"I don't know\" or \"I'm not sure.\"." 
                }]
            },
            { 
                role: "model", 
                parts: [{ 
                    text: "I understand! I'll be a helpful Linux desktop assistant, using casual language and appropriate formatting for different types of queries." 
                }]
            }
        ];
        
        // Add custom prompt if exists and not empty
        if (this._customPrompt && this._customPrompt !== 'default') {
            messages.push({
                role: "user",
                parts: [{ text: this._customPrompt }]
            });
            messages.push({
                role: "model",
                parts: [{ text: "I'll also follow these additional instructions in my responses." }]
            });
        }
        
        return messages;
    }

    loadCustomPrompt() {
        try {
            if (fileExists(CUSTOM_PROMPT_FILE)) {
                this._customPrompt = Utils.readFile(CUSTOM_PROMPT_FILE).trim();
                // Reset messages to include custom prompt
                this._messages = this.getInitialMessages();
                return true;
            }
        } catch (error) {
            console.error('Error loading custom prompt:', error);
        }
        this._customPrompt = '';
        return false;
    }

    setCustomPrompt(prompt) {
        try {
            // Create directory if it doesn't exist
            Utils.exec(`mkdir -p ${GLib.get_user_state_dir()}/ags/user/ai`);
            
            // Save the prompt
            Utils.writeFile(prompt, CUSTOM_PROMPT_FILE);
            this._customPrompt = prompt;
            
            // Clear existing messages
            this._messages = [];
            
            // Add base system messages
            const baseMessages = [
                { 
                    role: "user", 
                    parts: [{ 
                        text: "You are an assistant on a sidebar of a Wayland Linux desktop. Please always use a casual tone when answering your questions, unless requested otherwise or making writing suggestions. These are the steps you should take to respond to the user's queries:\n1. If it's a writing- or grammar-related question or a sentence in quotation marks, Please point out errors and correct when necessary using underlines, and make the writing more natural where appropriate without making too major changes. If you're given a sentence in quotes but is grammatically correct, explain briefly concepts that are uncommon.\n2. If it's a question about system tasks, give a bash command in a code block with brief explanation.\n3. Otherwise, when asked to summarize information or explaining concepts, you are should use bullet points and headings. For mathematics expressions, you *have to* use LaTeX within a code block with the language set as \"latex\". \nNote: Use casual language, be short, while ensuring the factual correctness of your response. If you are unsure or don't have enough information to provide a confident answer, simply say \"I don't know\" or \"I'm not sure.\"." 
                    }]
                },
                { 
                    role: "model", 
                    parts: [{ 
                        text: "I understand! I'll be a helpful Linux desktop assistant, using casual language and appropriate formatting for different types of queries." 
                    }]
                }
            ];
            
            // Add custom prompt
            if (prompt && prompt !== 'default') {
                baseMessages.push({
                    role: "user",
                    parts: [{ text: `Additional instructions: ${prompt}` }]
                });
                baseMessages.push({
                    role: "model",
                    parts: [{ text: "I'll also follow these additional instructions in my responses." }]
                });
            }
            
            this._messages = baseMessages;
            
            // Clear history since we're changing the base behavior
            if (fileExists(HISTORY_PATH)) {
                Utils.exec(`rm ${HISTORY_PATH}`);
            }
            
            this.emit('clear');
            return true;
        } catch (error) {
            console.error('Error setting custom prompt:', error);
            return false;
        }
    }

    clearCustomPrompt() {
        try {
            if (fileExists(CUSTOM_PROMPT_FILE)) {
                Utils.exec(`rm ${CUSTOM_PROMPT_FILE}`);
            }
            this._customPrompt = '';
            
            // Reset to default messages
            this._messages = [
                { 
                    role: "user", 
                    parts: [{ 
                        text: "You are an assistant on a sidebar of a Wayland Linux desktop. Please always use a casual tone when answering your questions, unless requested otherwise or making writing suggestions. These are the steps you should take to respond to the user's queries:\n1. If it's a writing- or grammar-related question or a sentence in quotation marks, Please point out errors and correct when necessary using underlines, and make the writing more natural where appropriate without making too major changes. If you're given a sentence in quotes but is grammatically correct, explain briefly concepts that are uncommon.\n2. If it's a question about system tasks, give a bash command in a code block with brief explanation.\n3. Otherwise, when asked to summarize information or explaining concepts, you are should use bullet points and headings. For mathematics expressions, you *have to* use LaTeX within a code block with the language set as \"latex\". \nNote: Use casual language, be short, while ensuring the factual correctness of your response. If you are unsure or don't have enough information to provide a confident answer, simply say \"I don't know\" or \"I'm not sure.\"." 
                    }]
                },
                { 
                    role: "model", 
                    parts: [{ 
                        text: "I understand! I'll be a helpful Linux desktop assistant, using casual language and appropriate formatting for different types of queries." 
                    }]
                }
            ];
            
            // Clear history since we're changing the base behavior
            if (fileExists(HISTORY_PATH)) {
                Utils.exec(`rm ${HISTORY_PATH}`);
            }
            
            this.emit('clear');
            return true;
        } catch (error) {
            console.error('Error clearing custom prompt:', error);
            return false;
        }
    }

    get modelName() { return CHAT_MODELS[this._modelIndex] }

    get keyPath() { return KEY_FILE_LOCATION }
    get key() { return this._key }
    set key(keyValue) {
        this._key = keyValue;
        Utils.writeFile(this._key, KEY_FILE_LOCATION)
            .then(this.emit('hasKey', true))
            .catch(print);
    }

    get cycleModels() { return this._cycleModels }
    set cycleModels(value) {
        this._cycleModels = value;
        if (!value) this._modelIndex = 0;
        else {
            this._modelIndex = (this._requestCount - (this._requestCount % ONE_CYCLE_COUNT)) % CHAT_MODELS.length;
        }
    }

    get useHistory() { return this._usingHistory; }
    set useHistory(value) {
        if (value && !this._usingHistory) this.loadHistory();
        this._usingHistory = value;
    }

    get safe() { return this._safe }
    set safe(value) { this._safe = value; }

    get temperature() { return this._temperature }
    set temperature(value) { this._temperature = value; }

    get messages() { return this._messages }
    get lastMessage() { return this._messages[this._messages.length - 1] }

    saveHistory() {
        try {
            Utils.exec(`mkdir -p ${HISTORY_DIR}`);
            const historyData = this._messages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.parts[0].text }],
                thinking: msg.thinking,
                done: msg.done
            }));
            Utils.writeFile(JSON.stringify(historyData, null, 2), HISTORY_PATH);
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    loadHistory() {
        try {
            if (fileExists(HISTORY_PATH)) {
                const historyContent = Utils.readFile(HISTORY_PATH);
                const historyData = JSON.parse(historyContent);

                // Clear current messages
                this._messages = [];

                // Reconstruct messages from history
                historyData.forEach(msg => {
                    const message = new GeminiMessage(
                        msg.role,
                        msg.parts[0].text,
                        msg.thinking || false,
                        msg.done !== false
                    );
                    this._messages.push(message);
                    this.emit('newMsg', this._messages.length - 1);
                });

                console.log('Loaded chat history:', this._messages.length, 'messages');
            } else {
                this._messages = this.getInitialMessages();
                console.log('No chat history found, starting fresh');
            }
        } catch (error) {
            console.error('Error loading history:', error);
            this._messages = this.getInitialMessages();
        }
    }

    clear() {
        this._messages = this.getInitialMessages();
        this.saveHistory();
        this.emit('clear');
    }

    get assistantPrompt() { return this._assistantPrompt; }
    set assistantPrompt(value) {
        this._assistantPrompt = value;
        if (value) this._messages = this.getInitialMessages();
        else this._messages = [];
    }

    async send(msg) {
        if (!this._key) {
            console.error('No API key found');
            return;
        }

        // Don't add system messages to history
        if (!msg.startsWith('/')) {
            this.addMessage('user', msg);
        }

        const aiResponse = new GeminiMessage('model', 'thinking...', true, false);
        this._messages.push(aiResponse);
        this.emit('newMsg', this._messages.length - 1);

        try {
            const session = new Soup.Session();
            session.set_timeout(30);

            const message = new Soup.Message({
                method: 'POST',
                uri: GLib.Uri.parse(
                    `https://generativelanguage.googleapis.com/v1/models/${CHAT_MODELS[this._modelIndex]}:generateContent?key=${this._key}`,
                    GLib.UriFlags.NONE
                ),
            });

            // Only include actual conversation messages
            const contents = this._messages
                .filter(msg => !msg.text?.startsWith('/'))
                .map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.parts[0].text }]
                }));

            const body = {
                contents,
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ],
                generationConfig: {
                    temperature: this._temperature,
                },
            };

            message.request_headers.append('Content-Type', 'application/json');
            message.set_request_body_from_bytes(
                'application/json',
                new GLib.Bytes(JSON.stringify(body))
            );

            const response = await new Promise((resolve, reject) => {
                session.send_async(message, GLib.DEFAULT_PRIORITY, null, (_, result) => {
                    try {
                        const stream = session.send_finish(result);
                        if (!stream) {
                            reject(new Error('No response stream received'));
                            return;
                        }
                        resolve(stream);
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            const dataStream = new Gio.DataInputStream({
                close_base_stream: true,
                base_stream: response
            });

            this.readResponse(dataStream, aiResponse);
        } catch (error) {
            console.error('Error sending message:', error);
            aiResponse.thinking = false;
            aiResponse.done = true;
            aiResponse.addDelta(`Error sending message: ${error.message}`);
            if (this._usingHistory) {
                this.saveHistory();
            }
        }
    }

    async sendWithImage(msg, imagePath) {
        try {
            this._processingImage = true;
            const [imageData, mimeType] = await this.processImage(imagePath);
            this._processingImage = false;

            this.addMessage('user', msg);
            const aiResponse = new GeminiMessage('model', 'thinking...', true, false);
            this._messages.push(aiResponse);
            this.emit('newMsg', this._messages.length - 1);

            const session = new Soup.Session();
            session.set_timeout(30);

            const message = new Soup.Message({
                method: 'POST',
                uri: GLib.Uri.parse(
                    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this._key}`,
                    GLib.UriFlags.NONE
                ),
            });

            const contents = this._messages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.parts[0].text }]
            }));

            const body = {
                contents: [{
                    role: "user",
                    parts: [
                        { text: msg },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: imageData
                            }
                        }
                    ]
                }],
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ],
                generationConfig: {
                    temperature: this._temperature,
                }
            };

            message.request_headers.append('Content-Type', 'application/json');
            message.set_request_body_from_bytes('application/json', new GLib.Bytes(JSON.stringify(body)));

            session.send_async(message, GLib.DEFAULT_PRIORITY, null, (_, result) => {
                try {
                    const stream = session.send_finish(result);
                    if (!stream) {
                        throw new Error('No response stream received');
                    }

                    const dataStream = new Gio.DataInputStream({
                        close_base_stream: true,
                        base_stream: stream
                    });

                    this.readResponse(dataStream, aiResponse);
                } catch (e) {
                    aiResponse.done = true;
                    aiResponse.addDelta('Error in vision API response: ' + e.message);
                }
            });
        } catch (error) {
            console.error('Error processing image:', error);
        }
    }

    readResponse(stream, aiResponse) {
        try {
            // Read the entire response at once
            const bytes = stream.read_bytes(1024 * 1024, null); // 1MB buffer
            if (!bytes || bytes.get_size() === 0) {
                throw new Error('Empty response received');
            }

            // Parse response
            const decoder = new TextDecoder();
            const responseText = decoder.decode(bytes);
            const response = JSON.parse(responseText);

            // Handle error responses
            if (response.error) {
                throw new Error(`API Error: ${response.error.message}`);
            }

            // Check for valid response structure
            if (!response.candidates || !response.candidates[0] || !response.candidates[0].content) {
                throw new Error('Invalid response structure');
            }

            const content = response.candidates[0].content;
            if (!content.parts || !content.parts[0] || typeof content.parts[0].text !== 'string') {
                throw new Error('Invalid content structure');
            }

            // Update message with the response text
            aiResponse.addDelta(content.parts[0].text);
            
            // If this was a successful response, add it to history
            if (!aiResponse.text.startsWith('/')) {
                this._messages[this._messages.length - 1] = {
                    role: 'model',
                    parts: [{ text: content.parts[0].text }],
                    thinking: false,
                    done: true
                };
            }

        } catch (error) {
            console.error('Error processing response:', error);
            aiResponse.addDelta(`Error: ${error.message}`);
        } finally {
            // Always mark as done
            aiResponse.thinking = false;
            aiResponse.done = true;
            if (this._usingHistory) {
                this.saveHistory();
            }
        }
    }

    addMessage(role, message) {
        const msg = new GeminiMessage(role, message, false, true);
        this._messages.push(msg);
        this.emit('newMsg', this._messages.length - 1);
        if (this._usingHistory) this.saveHistory();
    }

    async processImage(imagePath) {
        try {
            this._processingImage = true;
            const imageFile = Gio.File.new_for_path(imagePath);
            const [success, contents] = imageFile.load_contents(null);

            if (!success || !contents) {
                throw new Error('Failed to read image file');
            }

            const base64Data = GLib.base64_encode(contents);
            return [base64Data, 'image/jpeg'];
        } catch (error) {
            throw error;
        } finally {
            this._processingImage = false;
            this.emit('imageProcessing', false);
        }
    }
}

export default new GeminiService();
