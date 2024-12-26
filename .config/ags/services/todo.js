const { Gio, GLib } = imports.gi;
import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { exec, execAsync } = Utils;

class TodoService extends Service {
    static {
        Service.register(
            this,
            { 'updated': [], },
        );
    }

    _todoPath = '';
    _todoJson = [];
    _obsidianPath = '';

    refresh(value) {
        this.emit('updated', value);
    }

    connectWidget(widget, callback) {
        this.connect(widget, callback, 'updated');
    }

    get todo_json() {
        return this._todoJson;
    }

    _save() {
        Utils.writeFile(JSON.stringify(this._todoJson), this._todoPath)
            .catch(print);
        this._syncToObsidianFull();
    }

    _syncToObsidianFull() {
        try {
            let content = '# Todo List\n\n';
            this._todoJson.forEach(todo => {
                const checkbox = todo.done ? '[x]' : '[ ]';
                content += `- ${checkbox} ${todo.content} (Added: ${todo.timestamp || new Date().toLocaleString()})\n`;
            });
            Utils.writeFile(content, this._obsidianPath).catch(print);
        } catch (error) {
            print(`Error syncing to Obsidian: ${error}`);
        }
    }

    add(content) {
        const timestamp = new Date().toLocaleString();
        const newTodo = { content, done: false, timestamp };
        this._todoJson.push(newTodo);
        this._save();
        this.emit('updated');
    }

    check(index) {
        if (index >= 0 && index < this._todoJson.length) {
            this._todoJson[index].done = true;
            this._save();
            this.emit('updated');
        }
    }

    uncheck(index) {
        if (index >= 0 && index < this._todoJson.length) {
            this._todoJson[index].done = false;
            this._save();
            this.emit('updated');
        }
    }

    remove(index) {
        if (index >= 0 && index < this._todoJson.length) {
            this._todoJson.splice(index, 1);
            this._save();
            this.emit('updated');
        }
    }

    _syncFromObsidian() {
        try {
            const file = Gio.File.new_for_path(this._obsidianPath);
            const [, contents] = file.load_contents(null);
            const decoder = new TextDecoder('utf-8');
            const lines = decoder.decode(contents).split('\n');
            
            // Parse markdown file and update JSON
            const newTodos = [];
            lines.forEach(line => {
                const todoMatch = line.match(/^- \[([ x])\] (.+) \(Added: (.+)\)$/);
                if (todoMatch) {
                    newTodos.push({
                        content: todoMatch[2],
                        done: todoMatch[1] === 'x',
                        timestamp: todoMatch[3]
                    });
                }
            });
            
            // Only update if there are actual changes
            if (JSON.stringify(this._todoJson) !== JSON.stringify(newTodos)) {
                this._todoJson = newTodos;
                this._save();
                this.emit('updated');
            }
        } catch (error) {
            print(`Error syncing from Obsidian: ${error}`);
        }
    }

    constructor() {
        super();
        this._todoPath = `${GLib.get_user_state_dir()}/ags/user/todo.json`;
        this._obsidianPath = GLib.build_filenamev([GLib.get_home_dir(), 'Documents/obsidian/todo.md']);
        
        // Ensure Obsidian directory exists
        Utils.exec(`mkdir -p ${GLib.path_get_dirname(this._obsidianPath)}`);
        
        // Initialize or load JSON file
        try {
            const fileContents = Utils.readFile(this._todoPath);
            this._todoJson = JSON.parse(fileContents);
        } catch {
            Utils.exec(`mkdir -p ${GLib.get_user_cache_dir()}/ags/user`);
            Utils.exec(`touch ${this._todoPath}`);
            Utils.writeFile("[]", this._todoPath).then(() => {
                this._todoJson = [];
                this._save();
            }).catch(print);
        }

        // Monitor Obsidian file for changes
        Utils.monitorFile(
            this._obsidianPath,
            (file, event) => {
                if (event === 0 || event === 1) { // Created or Changed
                    this._syncFromObsidian();
                }
            }
        );

        // Initial sync
        if (GLib.file_test(this._obsidianPath, GLib.FileTest.EXISTS)) {
            this._syncFromObsidian();
        } else {
            this._syncToObsidianFull();
        }
    }
}

// the singleton instance
const service = new TodoService();

// make it global for easy use with cli
globalThis.todo = service;

// export to use in other modules
export default service;