import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup?version=3.0';
import { fileExists } from '../modules/.miscutils/files.js';

const HISTORY_DIR = `${GLib.get_user_state_dir()}/ags/user/ai/chats/`;
const HISTORY_FILENAME = `gemini.txt`;
const HISTORY_PATH = HISTORY_DIR + HISTORY_FILENAME;
const initMessages =
    [
        { role: "user", parts: [{ text: "You are an assistant on a sidebar of a Wayland Linux desktop. Please always use a casual tone when answering your questions, unless requested otherwise or making writing suggestions. These are the steps you should take to respond to the user's queries:\n1. If it's a writing- or grammar-related question or a sentence in quotation marks, Please point out errors and correct when necessary using underlines, and make the writing more natural where appropriate without making too major changes. If you're given a sentence in quotes but is grammatically correct, explain briefly concepts that are uncommon.\n2. If it's a question about system tasks, give a bash command in a code block with brief explanation.\n3. Otherwise, when asked to summarize information or explaining concepts, you are should use bullet points and headings. For mathematics expressions, you *have to* use LaTeX within a code block with the language set as \"latex\". \nNote: Use casual language, be short, while ensuring the factual correctness of your response. If you are unsure or don’t have enough information to provide a confident answer, simply say “I don’t know” or “I’m not sure.”. \nThanks!" }], },
        { role: "model", parts: [{ text: "Got it!" }], },
        { role: "user", parts: [{ text: "\"He rushed to where the event was supposed to be hold, he didn't know it got calceled\"" }], },
        { role: "model", parts: [{ text: "## Grammar correction\nErrors:\n\"He rushed to where the event was supposed to be __hold____,__ he didn't know it got calceled\"\nCorrection + minor improvements:\n\"He rushed to the place where the event was supposed to be __held____, but__ he didn't know that it got calceled\"" }], },
        { role: "user", parts: [{ text: "raise volume by 5%" }], },
        { role: "model", parts: [{ text: "## Volume +5```bash\nwpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+\n```\nThis command uses the `wpctl` utility to adjust the volume of the default sink." }], }, { role: "user", parts: [{ text: "main advantages of the nixos operating system" }], },
        { role: "model", parts: [{ text: "## NixOS advantages\n- **Reproducible**: A config working on one device will also work on another\n- **Declarative**: One config language to rule them all. Effortlessly share them with others.\n- **Reliable**: Per-program software versioning. Mitigates the impact of software breakage" }], },
        { role: "user", parts: [{ text: "whats skeumorphism" }], },
        { role: "model", parts: [{ text: "## Skeuomorphism\n- A design philosophy- From early days of interface designing- Tries to imitate real-life objects- It's in fact still used by Apple in their icons until today." }], },
        { role: "user", parts: [{ text: "\"ignorance is bliss\"" }], },
        { role: "model", parts: [{ text: "## \"Ignorance is bliss\"\n- A Latin proverb that means being unaware of something negative can be a source of happiness\n- Often used to justify avoiding difficult truths or responsibilities\n- Can also be interpreted as a warning against seeking knowledge that may bring pain or sorrow" }], },
        { role: "user", parts: [{ text: "find the derivative of (x-438)/(x^2+23x-7)+x^x" }], },
        { role: "model", parts: [{ text: "## Derivative\n```latex\n\\[\n\\frac{d}{dx}\\left(\\frac{x - 438}{x^2 + 23x - 7} + x^x\\right) = \\frac{-(x^2+23x-7)-(x-438)(2x+23)}{(x^2+23x-7)^2} + x^x(\\ln(x) + 1)\n\\]\n```" }], },
        { role: "user", parts: [{ text: "write the double angle formulas" }], },
        { role: "model", parts: [{ text: "## Double angle formulas\n```latex\n\\[\n\\sin(2\theta) = 2\\sin(\\theta)\\cos(\\theta)\n\\]\n\\\\\n\\[\n\\cos(2\\theta) = \\cos^2(\\theta) - \\sin^2(\\theta)\n\\]\n\\\\\n\\[\n\\tan(2\theta) = \\frac{2\\tan(\\theta)}{1 - \\tan^2(\\theta)}\n\\]\n```" }], },
    ];


if (!fileExists(`${GLib.get_user_config_dir()}/gemini_history.json`)) {
    Utils.execAsync([`bash`, `-c`, `touch ${GLib.get_user_config_dir()}/gemini_history.json`]).catch(print);
    Utils.writeFile('[ ]', `${GLib.get_user_config_dir()}/gemini_history.json`).catch(print);
}

Utils.exec(`mkdir -p ${GLib.get_user_state_dir()}/ags/user/ai`);
const KEY_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/ai/google_key.txt`;
const APIDOM_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/ai/google_api_dom.txt`;
function replaceapidom(URL) {
    if (fileExists(APIDOM_FILE_LOCATION)) {
        var contents = Utils.readFile(APIDOM_FILE_LOCATION).trim();
        var URL = URL.toString().replace("generativelanguage.googleapis.com", contents);
    }
    return URL;
}
const CHAT_MODELS = ["gemini-1.5-flash", "gemini-1.5-flash"] // Using same model for both since it supports vision
const ONE_CYCLE_COUNT = 3;

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
    _usingHistory = userOptions.asyncGet().ai.useHistory;
    _key = '';
    _requestCount = 0;
    _safe = userOptions.asyncGet().ai.safety;
    _temperature = userOptions.asyncGet().ai.defaultTemperature;
    _messages = [];
    _modelIndex = 0;
    _decoder = new TextDecoder();
    _processingImage = false;

    constructor() {
        super();

        if (fileExists(KEY_FILE_LOCATION)) this._key = Utils.readFile(KEY_FILE_LOCATION).trim();
        else this.emit('hasKey', false);

        // if (this._usingHistory) Utils.timeout(1000, () => this.loadHistory());
        if (this._usingHistory) this.loadHistory();
        else this._messages = this._assistantPrompt ? [...initMessages] : [];

        this.emit('initialized');
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
        Utils.exec(`bash -c 'mkdir -p ${HISTORY_DIR} && touch ${HISTORY_PATH}'`);
        Utils.writeFile(JSON.stringify(this._messages.map(msg => {
            let m = { role: msg.role, parts: msg.parts }; return m;
        })), HISTORY_PATH);
    }

    loadHistory() {
        this._messages = [];
        this.appendHistory();
        this._usingHistory = true;
    }

    appendHistory() {
        if (fileExists(HISTORY_PATH)) {
            const readfile = Utils.readFile(HISTORY_PATH);
            JSON.parse(readfile).forEach(element => {
                // this._messages.push(element);
                this.addMessage(element.role, element.parts[0].text);
            });
            // console.log(this._messages)
            // this._messages = this._messages.concat(JSON.parse(readfile));
            // for (let index = 0; index < this._messages.length; index++) {
            //     this.emit('newMsg', index);
            // }
        }
        else {
            this._messages = this._assistantPrompt ? [...initMessages] : []
        }
    }

    clear() {
        this._messages = this._assistantPrompt ? [...initMessages] : [];
        if (this._usingHistory) this.saveHistory();
        this.emit('clear');
    }

    get assistantPrompt() { return this._assistantPrompt; }
    set assistantPrompt(value) {
        this._assistantPrompt = value;
        if (value) this._messages = [...initMessages];
        else this._messages = [];
    }

    readResponse(stream, aiResponse) {
        stream.read_line_async(
            0, null,
            (stream, res) => {
                try {
                    const [bytes] = stream.read_line_finish(res);
                    if (!bytes) {
                        // Try to parse accumulated response
                        if (aiResponse._rawData) {
                            try {
                                const response = JSON.parse(aiResponse._rawData);
                                if (response.error) {
                                    const errorMsg = `Error: ${response.error.message} (${response.error.status})`;
                                    aiResponse.addDelta(errorMsg);
                                }
                                else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
                                    const text = response.candidates[0].content.parts[0].text;
                                    aiResponse.addDelta(text);
                                }
                                else {
                                    aiResponse.addDelta('Error: Unexpected response format');
                                }
                            } catch (e) {
                                aiResponse.addDelta('Error parsing response');
                            }
                        }
                        
                        aiResponse.thinking = false;
                        aiResponse.done = true;
                        if (this._usingHistory) this.saveHistory();
                        return;
                    }

                    const line = this._decoder.decode(bytes);
                    aiResponse._rawData = (aiResponse._rawData || '') + line;

                    // Handle error responses immediately
                    if (line.includes('"error"')) {
                        try {
                            const errorResponse = JSON.parse(aiResponse._rawData + line + '}');
                            const errorMsg = `Error: ${errorResponse.error.message} (${errorResponse.error.status})`;
                            aiResponse.addDelta(errorMsg);
                            aiResponse.thinking = false;
                            aiResponse.done = true;
                            return;
                        } catch (e) {
                        }
                    }

                    // Try to parse complete response
                    if (line.trim().endsWith('}')) {
                        try {
                            const response = JSON.parse(aiResponse._rawData);
                            if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
                                const text = response.candidates[0].content.parts[0].text;
                                aiResponse.addDelta(text);
                                aiResponse.thinking = false;
                                aiResponse.done = true;
                                return;
                            }
                        } catch (e) {
                        }
                    }

                    // Continue reading
                    this.readResponse(stream, aiResponse);
                } catch (error) {
                    aiResponse.done = true;
                    aiResponse.addDelta('Error reading response: ' + error.message);
                    if (this._usingHistory) this.saveHistory();
                    return;
                }
            });
    }

    addMessage(role, message) {
        this._messages.push(new GeminiMessage(role, message, false));
        this.emit('newMsg', this._messages.length - 1);
    }

    send(msg) {
        this._messages.push(new GeminiMessage('user', msg, false));
        this.emit('newMsg', this._messages.length - 1);
        const aiResponse = new GeminiMessage('model', 'thinking...', true, false);

        const body = {
            "contents": [{
                "role": "user",
                "parts": [{ "text": msg }]
            }],
            "safetySettings": this._safe ? [] : [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            ],
            "generationConfig": {
                "temperature": this._temperature,
            },
        };

        const session = new Soup.Session();
        session.set_timeout(30); // 30 second timeout
        
        const proxyUrl = userOptions.asyncGet().ai.proxyUrl;
        if (proxyUrl && proxyUrl.length > 0) {
            const proxyResolver = new Gio.SimpleProxyResolver();
            proxyResolver.set_default_proxy(proxyUrl);
            session.set_proxy_resolver(proxyResolver);
        }

        const apiUrl = replaceapidom(`https://generativelanguage.googleapis.com/v1/models/${this.modelName}:generateContent?key=${this._key}`);
        
        const message = new Soup.Message({
            method: 'POST',
            uri: GLib.Uri.parse(apiUrl, GLib.UriFlags.NONE),
        });
        
        message.request_headers.append('Content-Type', 'application/json');
        const bodyBytes = new GLib.Bytes(JSON.stringify(body));
        message.set_request_body_from_bytes('application/json', bodyBytes);

        this._messages.push(aiResponse);
        this.emit('newMsg', this._messages.length - 1);

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
            }
            catch (e) {
                aiResponse.done = true;
                aiResponse.addDelta('Error in API response: ' + e.message);
            }
        });

        if (this._cycleModels && ++this._requestCount % ONE_CYCLE_COUNT == 0)
            this._modelIndex = (this._requestCount - (this._requestCount % ONE_CYCLE_COUNT)) % CHAT_MODELS.length;
    }

    async processImage(imagePath) {
        try {
            this._processingImage = true;
            this.emit('imageProcessing', true);
            
            const imageFile = Gio.File.new_for_path(imagePath);
            const [success, contents] = imageFile.load_contents(null);
            
            if (!success || !contents) {
                throw new Error('Failed to read image file');
            }
            
            const base64Data = GLib.base64_encode(contents);
            return base64Data;
        } catch (error) {
            throw error;
        } finally {
            this._processingImage = false;
            this.emit('imageProcessing', false);
        }
    }

    async sendWithImage(msg, imagePath) {
        try {
            const imageData = await this.processImage(imagePath);
            
            this._modelIndex = 0;
            
            const userMessage = new GeminiMessage('user', msg, false, false, imageData);
            this._messages.push(userMessage);
            this.emit('newMsg', this._messages.length - 1);
            
            const aiResponse = new GeminiMessage('model', 'Analyzing image...', true, false);
            
            const body = {
                "contents": [{
                    "role": userMessage.role,
                    "parts": [
                        {
                            "text": msg
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/png",
                                "data": imageData
                            }
                        }
                    ]
                }],
                "safety_settings": this._safe ? [] : [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                ],
                "generation_config": {
                    "temperature": this._temperature,
                }
            };

            const session = new Soup.Session();
            session.set_timeout(30); // 30 second timeout
            
            const proxyUrl = userOptions.asyncGet().ai.proxyUrl;
            if (proxyUrl && proxyUrl.length > 0) {
                const proxyResolver = new Gio.SimpleProxyResolver();
                proxyResolver.set_default_proxy(proxyUrl);
                session.set_proxy_resolver(proxyResolver);
            }

            const apiUrl = replaceapidom(`https://generativelanguage.googleapis.com/v1/models/${this.modelName}:generateContent?key=${this._key}`);
            
            const message = new Soup.Message({
                method: 'POST',
                uri: GLib.Uri.parse(apiUrl, GLib.UriFlags.NONE),
            });
            
            message.request_headers.append('Content-Type', 'application/json');
            const bodyBytes = new GLib.Bytes(JSON.stringify(body));
            message.set_request_body_from_bytes('application/json', bodyBytes);

            this._messages.push(aiResponse);
            this.emit('newMsg', this._messages.length - 1);

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
                }
                catch (e) {
                    aiResponse.done = true;
                    aiResponse.addDelta('Error in vision API response: ' + e.message);
                }
            });
        } catch (error) {
            throw error;
        }
    }
}

export default new GeminiService();
