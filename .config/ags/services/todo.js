const { Gio, GLib } = imports.gi;
import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { execAsync } = Utils;

class TodoService extends Service {
    static {
        Service.register(this, {
            'updated': ['double'],
            'changed': [],
            'todo_json': ['jsobject'],
            'notes_json': ['jsobject'],
            'error': ['string'],  // New signal for error reporting
        }, {
            'todo_json': ['jsobject', 'rw'],
            'notes_json': ['jsobject', 'rw'],
        });
    }

    // File paths
    #todoFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'todo.json']);
    #notesFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'notes.json']);
    #todoMdFile = GLib.build_filenamev([GLib.get_home_dir(), 'Documents/obsidian/todo.md']);
    #notesMdFile = GLib.build_filenamev([GLib.get_home_dir(), 'Documents/obsidian/notes.md']);

    // State management
    #todoJson = [];
    #notesJson = [];
    #lastMdSync = 0;
    #syncDebounceTimeout = null;
    #fileMonitors = new Map();
    #syncInProgress = false;

    // Constants
    #SYNC_DEBOUNCE_MS = 1000;  // 1 second debounce
    #MAX_RETRIES = 3;
    #RETRY_DELAY_MS = 500;

    constructor() {
        super();

        // Ensure directories exist
        this.#ensureDirectories();

        // Initialize state
        this.#initializeState();

        // Setup file monitoring
        this.#setupFileMonitors();
    }

    #ensureDirectories() {
        try {
            const stateDir = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags']);
            const obsidianDir = GLib.build_filenamev([GLib.get_home_dir(), 'Documents/obsidian']);
            
            [stateDir, obsidianDir].forEach(dir => {
                if (!GLib.file_test(dir, GLib.FileTest.EXISTS)) {
                    GLib.mkdir_with_parents(dir, 0o755);
                }
            });
        } catch (e) {
            console.error('Failed to create directories:', e);
            this.emit('error', 'Failed to create required directories');
        }
    }

    async #initializeState() {
        try {
            // Initialize JSON state
            this.#todoJson = await this.#readJsonFile(this.#todoFile) || [];
            this.#notesJson = await this.#readJsonFile(this.#notesFile) || [];

            // Create files if they don't exist
            await this.#ensureFiles();

            // Initial sync
            await this.#syncToMd();
        } catch (e) {
            console.error('Failed to initialize state:', e);
            this.emit('error', 'Failed to initialize state');
        }
    }

    async #readJsonFile(path) {
        try {
            const content = await Utils.readFile(path);
            return content ? JSON.parse(content) : null;
        } catch (e) {
            console.error(`Failed to read ${path}:`, e);
            return null;
        }
    }

    async #ensureFiles() {
        const files = [
            [this.#todoFile, '[]'],
            [this.#notesFile, '[]'],
            [this.#todoMdFile, ''],
            [this.#notesMdFile, ''],
        ];

        for (const [path, defaultContent] of files) {
            if (!GLib.file_test(path, GLib.FileTest.EXISTS)) {
                try {
                    await Utils.writeFile(defaultContent, path);
                } catch (e) {
                    console.error(`Failed to create ${path}:`, e);
                    this.emit('error', `Failed to create ${path}`);
                }
            }
        }
    }

    #setupFileMonitors() {
        const files = [
            [this.#todoMdFile, this.#handleMdChange.bind(this, 'todo')],
            [this.#notesMdFile, this.#handleMdChange.bind(this, 'notes')],
        ];

        files.forEach(([path, callback]) => {
            try {
                const file = Gio.File.new_for_path(path);
                const monitor = file.monitor_file(Gio.FileMonitorFlags.NONE, null);
                monitor.connect('changed', callback);
                this.#fileMonitors.set(path, monitor);
            } catch (e) {
                console.error(`Failed to setup monitor for ${path}:`, e);
                this.emit('error', `Failed to monitor ${path}`);
            }
        });
    }

    #handleMdChange(type, _, file, __, eventType) {
        if (eventType === Gio.FileMonitorEvent.CHANGED && !this.#syncInProgress) {
            const now = GLib.get_monotonic_time() / 1000;
            if (now - this.#lastMdSync > this.#SYNC_DEBOUNCE_MS) {
                this.#lastMdSync = now;
                this.#syncFromMd(type);
            }
        }
    }

    // Debounced sync to markdown
    #debouncedSync() {
        if (this.#syncDebounceTimeout) {
            GLib.source_remove(this.#syncDebounceTimeout);
        }

        this.#syncDebounceTimeout = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            this.#SYNC_DEBOUNCE_MS,
            () => {
                this.#syncToMd();
                this.#syncDebounceTimeout = null;
                return GLib.SOURCE_REMOVE;
            }
        );
    }

    async #syncToMd() {
        if (this.#syncInProgress) return;
        this.#syncInProgress = true;

        try {
            // Convert todos to markdown
            const todoMd = this.#todoJson
                .filter(task => task.type === 'todo')
                .map(task => `- [${task.done ? 'x' : ' '}] ${task.content}`)
                .join('\n');

            // Convert notes to markdown
            const notesMd = this.#notesJson
                .map(note => `- ${note.content}`)
                .join('\n');

            // Write files with retry mechanism
            await this.#writeFileWithRetry(this.#todoMdFile, todoMd || ' ');
            await this.#writeFileWithRetry(this.#notesMdFile, notesMd || ' ');
        } catch (e) {
            console.error('Failed to sync to markdown:', e);
            this.emit('error', 'Failed to sync to markdown files');
        } finally {
            this.#syncInProgress = false;
        }
    }

    async #syncFromMd(type) {
        if (this.#syncInProgress) return;
        this.#syncInProgress = true;

        try {
            if (type === 'todo' || !type) {
                const todoContent = await Utils.readFile(this.#todoMdFile);
                if (todoContent) {
                    this.#todoJson = todoContent
                        .split('\n')
                        .filter(line => line.trim() && line.match(/^- \[[ x]\]/))
                        .map(line => ({
                            content: line.substring(6),
                            done: line[3] === 'x',
                            type: 'todo',
                        }));
                    await this.#writeFileWithRetry(this.#todoFile, JSON.stringify(this.#todoJson));
                }
            }

            if (type === 'notes' || !type) {
                const notesContent = await Utils.readFile(this.#notesMdFile);
                if (notesContent) {
                    this.#notesJson = notesContent
                        .split('\n')
                        .filter(line => line.trim() && line.startsWith('- '))
                        .map(line => ({
                            content: line.substring(2).trim(),
                            type: 'note',
                        }));
                    await this.#writeFileWithRetry(this.#notesFile, JSON.stringify(this.#notesJson));
                }
            }

            this.#emitUpdated();
        } catch (e) {
            console.error('Failed to sync from markdown:', e);
            this.emit('error', 'Failed to sync from markdown files');
        } finally {
            this.#syncInProgress = false;
        }
    }

    async #writeFileWithRetry(path, content, retries = this.#MAX_RETRIES) {
        try {
            await Utils.writeFile(content, path);
        } catch (e) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, this.#RETRY_DELAY_MS));
                return this.#writeFileWithRetry(path, content, retries - 1);
            }
            throw e;
        }
    }

    #emitUpdated() {
        this.emit('updated', GLib.get_monotonic_time());
        this.emit('changed');
        this.notify('todo_json');
        this.notify('notes_json');
    }

    // Public API
    get todo_json() { return this.#todoJson }
    set todo_json(value) { 
        this.#todoJson = value;
        this.#debouncedSync();
    }

    get notes_json() { return this.#notesJson }
    set notes_json(value) { 
        this.#notesJson = value;
        this.#debouncedSync();
    }

    async add(content) {
        try {
            this.#todoJson.push({ content, done: false, type: 'todo' });
            await this.#writeFileWithRetry(this.#todoFile, JSON.stringify(this.#todoJson));
            this.#debouncedSync();
            this.#emitUpdated();
        } catch (e) {
            console.error('Failed to add todo:', e);
            this.emit('error', 'Failed to add todo');
        }
    }

    async addNote(content) {
        try {
            this.#notesJson.push({ content, type: 'note' });
            await this.#writeFileWithRetry(this.#notesFile, JSON.stringify(this.#notesJson));
            this.#debouncedSync();
            this.#emitUpdated();
        } catch (e) {
            console.error('Failed to add note:', e);
            this.emit('error', 'Failed to add note');
        }
    }

    async remove(id, isNote = false) {
        try {
            const array = isNote ? this.#notesJson : this.#todoJson;
            const file = isNote ? this.#notesFile : this.#todoFile;

            if (id >= 0 && id < array.length) {
                array.splice(id, 1);
                await this.#writeFileWithRetry(file, JSON.stringify(array));
                this.#debouncedSync();
                this.#emitUpdated();
            }
        } catch (e) {
            console.error('Failed to remove item:', e);
            this.emit('error', 'Failed to remove item');
        }
    }

    async check(id) {
        try {
            if (id >= 0 && id < this.#todoJson.length) {
                const task = this.#todoJson[id];
                if (task?.type === 'todo') {
                    task.done = true;
                    await this.#writeFileWithRetry(this.#todoFile, JSON.stringify(this.#todoJson));
                    this.#debouncedSync();
                    this.#emitUpdated();
                }
            }
        } catch (e) {
            console.error('Failed to check todo:', e);
            this.emit('error', 'Failed to check todo');
        }
    }

    async uncheck(id) {
        try {
            if (id >= 0 && id < this.#todoJson.length) {
                const task = this.#todoJson[id];
                if (task?.type === 'todo') {
                    task.done = false;
                    await this.#writeFileWithRetry(this.#todoFile, JSON.stringify(this.#todoJson));
                    this.#debouncedSync();
                    this.#emitUpdated();
                }
            }
        } catch (e) {
            console.error('Failed to uncheck todo:', e);
            this.emit('error', 'Failed to uncheck todo');
        }
    }

    destroy() {
        // Cleanup file monitors
        for (const monitor of this.#fileMonitors.values()) {
            monitor.cancel();
        }
        this.#fileMonitors.clear();

        // Clear any pending timeouts
        if (this.#syncDebounceTimeout) {
            GLib.source_remove(this.#syncDebounceTimeout);
        }

        super.destroy();
    }
}

// The singleton instance
const service = new TodoService();

// Make it global for easy use with cli
globalThis.todo = service;

// Export to use in other modules
export default service;