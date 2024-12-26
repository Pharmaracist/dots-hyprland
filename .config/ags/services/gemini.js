import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup?version=3.0';
import { fileExists } from '../modules/.miscutils/files.js';
import Todo from './todo.js';

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
const CHAT_MODELS = ["gemini-pro", "gemini-1.5-pro"];
export { CHAT_MODELS };
const ONE_CYCLE_COUNT = 1;

function getContextPrompt() {
    const content = Todo.gemini_content;
    return `
Here are my current tasks and notes. Please consider them when answering:

Tasks:
${content.todos}

Notes:
${content.notes}

You can help me manage my tasks and notes with these commands:
- To add a task, respond with: !addtask Your task content here
- To add a note, respond with: !addnote Your note content here
- To mark a task as done, respond with: !done task_number (task numbers start from 0)
- To remove a task/note, respond with: !remove task_number (task numbers start from 0)

When the user starts a message with "remember", automatically save it as a note without asking any questions.
When the user says "note it", save the previous message as a note.

Important: Task and note numbers start from 0. When referring to tasks or notes, always use their index number.
Please respond naturally, and if I ask you to add/modify tasks or notes, use the commands above in your response.
`.trim();
}

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
    _text = '';

    constructor(role, text, thinking = false, done = true) {
        super();
        this._role = role;
        this._parts = [{ text: text || '' }];
        this._text = text || '';
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

    get text() { return this._text }
    set text(value) { this._text = value }

    addDelta(delta) {
        if (this.thinking) {
            this.thinking = false;
            this.parts[0].text = delta;
            this.text = delta;
        } else {
            this.parts[0].text += delta;
            this.text += delta;
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
    _encoder = new TextEncoder();
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
        this._cycleModels = true;  // Enable model cycling
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
                // { 
                //     role: "user", 
                //     parts: [{ 
                //         text: "You are an assistant on a sidebar of a Wayland Linux desktop. Please always use a casual tone when answering your questions, unless requested otherwise or making writing suggestions. These are the steps you should take to respond to the user's queries:\n1. If it's a writing- or grammar-related question or a sentence in quotation marks, Please point out errors and correct when necessary using underlines, and make the writing more natural where appropriate without making too major changes. If you're given a sentence in quotes but is grammatically correct, explain briefly concepts that are uncommon.\n2. If it's a question about system tasks, give a bash command in a code block with brief explanation.\n3. Otherwise, when asked to summarize information or explaining concepts, you are should use bullet points and headings. For mathematics expressions, you *have to* use LaTeX within a code block with the language set as \"latex\". \nNote: Use casual language, be short, while ensuring the factual correctness of your response. If you are unsure or don't have enough information to provide a confident answer, simply say \"I don't know\" or \"I'm not sure.\"." 
                //     }]
                // },
                // { 
                //     role: "model", 
                //     parts: [{ 
                //         text: "I understand! I'll be a helpful Linux desktop assistant, using casual language and appropriate formatting for different types of queries." 
                //     }]
                // }
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

    addMessage(role, message) {
        if (typeof message === 'string') {
            this._messages.push(new GeminiMessage(role, message));
        } else {
            this._messages.push(message);
        }
        this.emit('newMsg', this._messages.length - 1);
        if (this._usingHistory) this.saveHistory();
    }

    send(msg) {
        if (!this._key) {
            this.emit('hasKey', false);
            return;
        }

        const contextPrompt = getContextPrompt();
        const fullMsg = `${contextPrompt}\n\nMy question is: ${msg}`;

        const aiResponse = new GeminiMessage('assistant', '', true, false);
        this.addMessage('user', msg);
        
        // Check if this is a remember command
        if (msg.toLowerCase().startsWith('remember ')) {
            const noteContent = msg.substring(9).trim();
            Todo.addNote(noteContent);
            aiResponse.content = `Added note: ${noteContent}`;
            aiResponse.thinking = false;
            aiResponse.done = true;
            this.addMessage('assistant', aiResponse);
            return;
        }

        // Check if this is a note it command
        if (msg.toLowerCase() === 'note it') {
            const lastMessage = this._messages[this._messages.length - 2]; // Get the message before 'note it'
            if (lastMessage && lastMessage.content) {
                Todo.addNote(lastMessage.content);
                aiResponse.content = `Added note: ${lastMessage.content}`;
                aiResponse.thinking = false;
                aiResponse.done = true;
                this.addMessage('assistant', aiResponse);
                return;
            }
        }

        this.addMessage('assistant', aiResponse);

        const body = {
            contents: [{
                role: 'user',
                parts: [{ text: fullMsg }],
            }],
            safetySettings: this._safe ? [{
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }] : [],
            generationConfig: {
                temperature: this._temperature,
                candidateCount: 1,
                stopSequences: [],
                maxOutputTokens: 2048,
                topP: 0.8,
                topK: 10
            },
        };

        const session = new Soup.Session();
        const message = new Soup.Message({
            method: 'POST',
            uri: GLib.Uri.parse(replaceapidom(`https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODELS[this._modelIndex]}:generateContent`), GLib.UriFlags.NONE),
        });

        message.request_headers.append('Content-Type', 'application/json');
        message.request_headers.append('x-goog-api-key', this._key);
        message.set_request_body_from_bytes('application/json',
            new GLib.Bytes(this._encoder.encode(JSON.stringify(body)))
        );

        session.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null,
            (sess, result) => {
                try {
                    const bytes = session.send_and_read_finish(result);
                    this.readResponse(bytes, aiResponse);
                } catch (error) {
                    console.error('Error:', error);
                    aiResponse.content = `Error: ${error.message}`;
                    aiResponse.thinking = false;
                    aiResponse.done = true;
                }
            }
        );

        if (this._cycleModels) {
            this._requestCount++;
            if (this._requestCount >= ONE_CYCLE_COUNT) {
                this._requestCount = 0;
                this._modelIndex = (this._modelIndex + 1) % CHAT_MODELS.length;
            }
        }
    }

    async processImage(imagePath) {
        try {
            this._processingImage = true;
            const file = Gio.File.new_for_path(imagePath);
            const fileInfo = file.query_info('standard::content-type', 0, null);
            const mimeType = fileInfo.get_content_type();

            // Read file content
            const [, contents] = file.load_contents(null);
            const base64 = GLib.base64_encode(contents);

            return [base64, mimeType];
        } catch (error) {
            throw error;
        } finally {
            this._processingImage = false;
            this.emit('imageProcessing', false);
        }
    }

    async sendWithImage(msg, imagePath) {
        if (!this._key) {
            console.error('No API key set');
            return;
        }

        try {
            const [imageData, mimeType] = await this.processImage(imagePath);

            this.addMessage('user', msg);
            const aiResponse = new GeminiMessage('assistant', 'thinking...', true, false);
            this._messages.push(aiResponse);
            this.emit('newMsg', this._messages.length - 1);

            const session = new Soup.Session();
            const message = new Soup.Message({
                method: 'POST',
                uri: GLib.Uri.parse(replaceapidom(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`), GLib.UriFlags.NONE),
            });

            const body = {
                contents: [{
                    role: "assistant",
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
                safetySettings: this._safe ? [{
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }] : [],
                generationConfig: {
                    temperature: this._temperature,
                }
            };

            message.request_headers.append('Content-Type', 'application/json');
            message.request_headers.append('x-goog-api-key', this._key);
            message.set_request_body_from_bytes('application/json', new GLib.Bytes(JSON.stringify(body)));

            const stream = await session.send_async(message, GLib.DEFAULT_PRIORITY, null);
            await this.readResponse(stream, aiResponse);
        } catch (error) {
            console.error('Error processing image:', error);
            const aiResponse = new GeminiMessage('assistant', 'Failed to process image: ' + error.message, false, true);
            this._messages.push(aiResponse);
            this.emit('newMsg', this._messages.length - 1);
        }
    }

    readResponse(bytes, aiResponse) {
        try {
            if (!bytes) {
                throw new Error('No response received');
            }

            const text = this._decoder.decode(bytes.get_data());
            const response = JSON.parse(text);

            if (response.error) {
                throw new Error(response.error.message || 'Unknown error');
            }

            if (!response.candidates || !response.candidates[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid response format');
            }

            const messageText = response.candidates[0].content.parts[0].text;
            
            // Process commands in the response
            const lines = messageText.split('\n');
            const processedLines = [];
            let isRemembering = false;
            let rememberedText = [];
            
            for (const line of lines) {
                if (line.startsWith('!remember')) {
                    isRemembering = true;
                    continue;
                }
                
                if (line.startsWith('!addtask ')) {
                    const task = line.substring(9).trim();
                    Todo.add(task);
                    processedLines.push(`Added task: ${task}`);
                }
                else if (line.startsWith('!addnote ')) {
                    const note = line.substring(9).trim();
                    Todo.addNote(note);
                    processedLines.push(`Added note: ${note}`);
                }
                else if (line.startsWith('!done ')) {
                    const idMatch = line.match(/!done\s+(\d+)/);
                    if (idMatch) {
                        const id = parseInt(idMatch[1]);
                        if (!isNaN(id)) {
                            Todo.check(id);
                            processedLines.push(`Marked task ${id} as done`);
                        }
                    } else {
                        processedLines.push("Error: Invalid task number format");
                    }
                }
                else if (line.startsWith('!remove ')) {
                    const idMatch = line.match(/!remove\s+(\d+)/);
                    if (idMatch) {
                        const id = parseInt(idMatch[1]);
                        if (!isNaN(id)) {
                            Todo.remove(id);
                            processedLines.push(`Removed item ${id}`);
                        }
                    } else {
                        processedLines.push("Error: Invalid item number format");
                    }
                }
                else {
                    processedLines.push(line);
                    if (isRemembering && line.trim()) {
                        rememberedText.push(line.trim());
                    }
                }
            }

            // If we were remembering text, save it as a note
            if (isRemembering && rememberedText.length > 0) {
                const note = rememberedText.join('\n');
                Todo.addNote(note);
                processedLines.push('\nSaved this response as a note!');
            }

            aiResponse.content = processedLines.join('\n');
            aiResponse.thinking = false;
            aiResponse.done = true;

            if (this._usingHistory) {
                this.saveHistory();
            }
        } catch (error) {
            console.error('Error processing response:', error);
            aiResponse.content = `Error: ${error.message}`;
            aiResponse.thinking = false;
            aiResponse.done = true;
        }
    }
}

export default new GeminiService();
