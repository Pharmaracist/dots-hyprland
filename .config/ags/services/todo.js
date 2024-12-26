const { Gio, GLib } = imports.gi;
import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { execAsync } = Utils;

class TodoService extends Service {
    static {
        Service.register(this, {
            'updated': ['double'],
        }, {
            'todo_json': ['jsobject', 'rw'],
            'notes_json': ['jsobject', 'rw'],
            'gemini_content': ['jsobject', 'r'],
        });
    }

    #todoFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'todo.json']);
    #notesFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'notes.json']);
    #todoMdFile = GLib.build_filenamev([GLib.get_home_dir(), 'Documents/obsidian/todo.md']);
    #notesMdFile = GLib.build_filenamev([GLib.get_home_dir(), 'Documents/obsidian/notes.md']);
    #todoJson = [];
    #notesJson = [];
    #md = '';
    #notesMd = '';

    #emitUpdated() {
        this.emit('updated', GLib.get_monotonic_time());
    }

    constructor() {
        super();

        try {
            const todoFileContent = Utils.readFile(this.#todoFile);
            this.#todoJson = todoFileContent ? JSON.parse(todoFileContent) : [];
        } catch (e) {
            this.#todoJson = [];
            Utils.writeFile('[]', this.#todoFile).catch(print);
        }

        try {
            const notesFileContent = Utils.readFile(this.#notesFile);
            this.#notesJson = notesFileContent ? JSON.parse(notesFileContent) : [];
        } catch (e) {
            this.#notesJson = [];
            Utils.writeFile('[]', this.#notesFile).catch(print);
        }

        // Initialize markdown content
        this.#md = Utils.readFile(this.#todoMdFile) || '';
        this.#notesMd = Utils.readFile(this.#notesMdFile) || '';

        // create files if they don't exist
        Utils.writeFile(this.#md || ' ', this.#todoMdFile).catch(print);
        Utils.writeFile(this.#notesMd || ' ', this.#notesMdFile).catch(print);

        // Monitor files for changes
        Utils.monitorFile(
            this.#todoMdFile,
            () => Utils.timeout(100, () => this.#syncFromMd())
        );
        Utils.monitorFile(
            this.#notesMdFile,
            () => Utils.timeout(100, () => this.#syncFromNotesMd())
        );

        // Initial sync
        this.#syncFromMd();
        this.#syncFromNotesMd();
    }

    get todo_json() { return this.#todoJson }
    set todo_json(value) { this.#todoJson = value }

    get notes_json() { return this.#notesJson }
    set notes_json(value) { this.#notesJson = value }

    get gemini_content() {
        const todos = this.#todoJson
            .filter(task => task.type !== 'note')
            .map(task => `- [${task.done ? 'x' : ' '}] ${task.content}`)
            .join('\n');

        const notes = this.#notesJson
            .map(note => `- ${note.content}`)
            .join('\n');

        return {
            todos: todos || 'No tasks',
            notes: notes || 'No notes',
        };
    }

    #syncToMd() {
        const md = this.#todoJson
            .filter(task => task.type !== 'note')
            .map(task => `- [${task.done ? 'x' : ' '}] ${task.content}`)
            .join('\n');
        Utils.writeFile(md || ' ', this.#todoMdFile)
            .catch(print);
    }

    #syncToNotesMd() {
        const md = this.#notesJson
            .map(note => `- ${note.content}`)
            .join('\n');
        Utils.writeFile(md || ' ', this.#notesMdFile)
            .catch(print);
    }

    #syncFromMd() {
        const newMd = Utils.readFile(this.#todoMdFile);
        if (!newMd) {
            this.#todoJson = [];
            Utils.writeFile('[]', this.#todoFile).catch(print);
            this.notify('todo_json');
            this.#emitUpdated();
            return;
        }

        if (newMd === this.#md) return;

        this.#md = newMd;
        const newTodos = newMd.split('\n')
            .filter(line => line.trim() && line.match(/^- \[[ x]\]/))
            .map(line => ({
                content: line.substring(6),
                done: line[3] === 'x',
                type: 'todo',
            }));

        this.#todoJson = newTodos;
        Utils.writeFile(JSON.stringify(this.#todoJson), this.#todoFile)
            .catch(print);

        this.notify('todo_json');
        this.#emitUpdated();
    }

    #syncFromNotesMd() {
        const newMd = Utils.readFile(this.#notesMdFile);
        if (!newMd) {
            this.#notesJson = [];
            Utils.writeFile('[]', this.#notesFile).catch(print);
            this.notify('notes_json');
            this.#emitUpdated();
            return;
        }

        if (newMd === this.#notesMd) return;

        this.#notesMd = newMd;
        const newNotes = newMd.split('\n')
            .filter(line => line.trim() && line.startsWith('- '))
            .map(line => ({
                content: line.substring(2).trim(),
                type: 'note',
            }));

        this.#notesJson = newNotes;
        Utils.writeFile(JSON.stringify(this.#notesJson), this.#notesFile)
            .catch(print);

        this.notify('notes_json');
        this.#emitUpdated();
    }

    add(content) {
        this.#todoJson.push({ content, done: false, type: 'todo' });
        Utils.writeFile(JSON.stringify(this.#todoJson || []), this.#todoFile)
            .catch(print);
        this.#syncToMd();
        this.notify('todo_json');
        this.#emitUpdated();
    }

    addNote(content) {
        this.#notesJson.push({ content, type: 'note' });
        Utils.writeFile(JSON.stringify(this.#notesJson || []), this.#notesFile)
            .catch(print);
        this.#syncToNotesMd();
        this.notify('notes_json');
        this.#emitUpdated();
    }

    check(id) {
        if (id < 0 || id >= this.#todoJson.length) return;
        
        const task = this.#todoJson[id];
        if (!task || task.type === 'note') return;
        
        task.done = true;
        Utils.writeFile(JSON.stringify(this.#todoJson), this.#todoFile)
            .catch(print);
        this.#syncToMd();
        this.notify('todo_json');
        this.#emitUpdated();
    }

    uncheck(id) {
        if (id < 0 || id >= this.#todoJson.length) return;
        
        const task = this.#todoJson[id];
        if (!task || task.type === 'note') return;
        
        task.done = false;
        Utils.writeFile(JSON.stringify(this.#todoJson), this.#todoFile)
            .catch(print);
        this.#syncToMd();
        this.notify('todo_json');
        this.#emitUpdated();
    }

    remove(id, isNote = false) {
        if (id < 0) return;
        
        if (isNote) {
            if (id >= 0 && id < this.#notesJson.length) {
                this.#notesJson.splice(id, 1);
                Utils.writeFile(JSON.stringify(this.#notesJson), this.#notesFile)
                    .catch(print);
                this.#syncToNotesMd();
                this.notify('notes_json');
            }
        } else {
            if (id >= 0 && id < this.#todoJson.length) {
                this.#todoJson.splice(id, 1);
                Utils.writeFile(JSON.stringify(this.#todoJson), this.#todoFile)
                    .catch(print);
                this.#syncToMd();
                this.notify('todo_json');
            }
        }
        this.#emitUpdated();
    }

    edit(id, newContent) {
        if (id >= 0 && id < this.#todoJson.length) {
            this.#todoJson[id].content = newContent;
            Utils.writeFile(JSON.stringify(this.#todoJson || []), this.#todoFile)
                .catch(print);
            this.#syncToMd();
            this.notify('todo_json');
            this.#emitUpdated();
        }
    }

    editNote(id, newContent) {
        if (id >= 0 && id < this.#notesJson.length) {
            this.#notesJson[id].content = newContent;
            Utils.writeFile(JSON.stringify(this.#notesJson || []), this.#notesFile)
                .catch(print);
            this.#syncToNotesMd();
            this.notify('notes_json');
            this.#emitUpdated();
        }
    }
}

// the singleton instance
const service = new TodoService();

// make it global for easy use with cli
globalThis.todo = service;

// export to use in other modules
export default service;