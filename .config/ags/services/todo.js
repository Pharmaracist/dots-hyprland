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
            'images_json': ['jsobject'],
            'pdfs_json': ['jsobject'],
            'videos_json': ['jsobject'],
            'gemini_content': ['jsobject'],
        }, {
            'todo_json': ['jsobject', 'rw'],
            'notes_json': ['jsobject', 'rw'],
            'images_json': ['jsobject', 'rw'],
            'pdfs_json': ['jsobject', 'rw'],
            'videos_json': ['jsobject', 'rw'],
            'gemini_content': ['jsobject', 'r'],
        });
    }

    #todoFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'todo.json']);
    #notesFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'notes.json']);
    #imagesFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'images.json']);
    #pdfsFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'pdfs.json']);
    #videosFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'videos.json']);
    #imagesDir = GLib.build_filenamev([GLib.get_home_dir(), 'Pictures', 'Dashboard']);
    #pdfsDir = GLib.build_filenamev([GLib.get_home_dir(), 'Documents', 'Dashboard']);
    #pdfThumbnailsDir = GLib.build_filenamev([GLib.get_home_dir(), 'Documents', 'Dashboard', 'thumbnails']);
    #videosDir = GLib.build_filenamev([GLib.get_home_dir(), 'Videos', 'Dashboard']);
    #thumbnailsDir = GLib.build_filenamev([GLib.get_home_dir(), 'Videos', 'Dashboard', 'thumbnails']);
    #todoMdFile = GLib.build_filenamev([GLib.get_home_dir(), 'Documents/obsidian/todo.md']);
    #notesMdFile = GLib.build_filenamev([GLib.get_home_dir(), 'Documents/obsidian/notes.md']);
    #todoJson = [];
    #notesJson = [];
    #imagesJson = [];
    #pdfsJson = [];
    #videosJson = [];
    #md = '';
    #notesMd = '';

    #emitUpdated() {
        this.emit('updated', GLib.get_monotonic_time());
        this.emit('changed');
        this.notify('todo_json');
        this.notify('notes_json');
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

        try {
            const imagesFileContent = Utils.readFile(this.#imagesFile);
            this.#imagesJson = imagesFileContent ? JSON.parse(imagesFileContent) : [];
        } catch (e) {
            this.#imagesJson = [];
            Utils.writeFile('[]', this.#imagesFile).catch(print);
        }

        try {
            const pdfsFileContent = Utils.readFile(this.#pdfsFile);
            this.#pdfsJson = pdfsFileContent ? JSON.parse(pdfsFileContent) : [];
        } catch (e) {
            this.#pdfsJson = [];
            Utils.writeFile('[]', this.#pdfsFile).catch(print);
        }

        try {
            const videosFileContent = Utils.readFile(this.#videosFile);
            this.#videosJson = videosFileContent ? JSON.parse(videosFileContent) : [];
        } catch (e) {
            this.#videosJson = [];
            Utils.writeFile('[]', this.#videosFile).catch(print);
        }

        // Initialize markdown content
        this.#md = Utils.readFile(this.#todoMdFile) || '';
        this.#notesMd = Utils.readFile(this.#notesMdFile) || '';

        // create files if they don't exist
        Utils.writeFile(this.#md || ' ', this.#todoMdFile).catch(print);
        Utils.writeFile(this.#notesMd || ' ', this.#notesMdFile).catch(print);

        // Create directories if they don't exist
        Utils.ensureDirectory(GLib.build_filenamev([GLib.get_user_state_dir(), 'ags']));
        Utils.ensureDirectory(this.#imagesDir);
        Utils.ensureDirectory(this.#pdfsDir);
        Utils.ensureDirectory(this.#pdfThumbnailsDir);
        Utils.ensureDirectory(this.#videosDir);
        Utils.ensureDirectory(this.#thumbnailsDir);

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

    get images_json() { return this.#imagesJson }
    set images_json(value) { this.#imagesJson = value }

    get pdfs_json() { return this.#pdfsJson }
    set pdfsJson(value) { this.#pdfsJson = value }

    get videos_json() { return this.#videosJson }
    set videos_json(value) {
        this.#videosJson = value;
        Utils.writeFile(JSON.stringify(value, null, 2), this.#videosFile)
            .catch(console.error);
        this.emit('changed');
        this.notify('videos_json');
    }

    get gemini_content() {
        const todos = this.#todoJson
            .filter(task => task.type !== 'note')
            .map(task => `- [${task.done ? 'x' : ' '}] ${task.content}`)
            .join('\n');

        const notes = this.#notesJson
            .map(note => `- ${note.content}`)
            .join('\n');

        const images = this.#imagesJson
            .map(image => `- ${image.name}`)
            .join('\n');

        const pdfs = this.#pdfsJson
            .map(pdf => `- ${pdf.name}`)
            .join('\n');

        const videos = this.#videosJson
            .map(video => `- ${video.name}`)
            .join('\n');

        return {
            todos: todos || 'No tasks',
            notes: notes || 'No notes',
            images: images || 'No images',
            pdfs: pdfs || 'No PDFs',
            videos: videos || 'No videos',
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
        this.#emitUpdated();
    }

    addNote(content) {
        this.#notesJson.push({ content, type: 'note' });
        Utils.writeFile(JSON.stringify(this.#notesJson || []), this.#notesFile)
            .catch(print);
        this.#syncToNotesMd();
        this.#emitUpdated();
    }

    check(id) {
        if (id < 0 || id >= this.#todoJson.length) return;
        
        const task = this.#todoJson[id];
        if (!task || task.type !== 'todo') return;
        
        task.done = true;
        Utils.writeFile(JSON.stringify(this.#todoJson), this.#todoFile)
            .catch(print);
        this.#syncToMd();
        this.#emitUpdated();
    }

    uncheck(id) {
        if (id < 0 || id >= this.#todoJson.length) return;
        
        const task = this.#todoJson[id];
        if (!task || task.type !== 'todo') return;
        
        task.done = false;
        Utils.writeFile(JSON.stringify(this.#todoJson), this.#todoFile)
            .catch(print);
        this.#syncToMd();
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
                this.#emitUpdated();
            }
        } else {
            if (id >= 0 && id < this.#todoJson.length) {
                this.#todoJson.splice(id, 1);
                Utils.writeFile(JSON.stringify(this.#todoJson), this.#todoFile)
                    .catch(print);
                this.#syncToMd();
                this.#emitUpdated();
            }
        }
    }

    addImage(sourcePath) {
        try {
            // Generate unique filename
            const timestamp = new Date().getTime();
            const sourceFile = Gio.File.new_for_path(sourcePath);
            const filename = sourceFile.get_basename();
            const name = filename.split('.')[0];
            const ext = filename.split('.').pop();
            const newFilename = `${name}_${timestamp}.${ext}`;
            const destPath = GLib.build_filenamev([this.#imagesDir, newFilename]);

            // Copy file to images directory
            if (this.#copyFile(sourcePath, destPath)) {
                this.#imagesJson.push({
                    path: destPath,
                    name: filename,
                    timestamp: timestamp,
                });
                Utils.writeFile(JSON.stringify(this.#imagesJson || []), this.#imagesFile)
                    .catch(print);
                this.notify('images_json');
                this.#emitUpdated();
                return true;
            }
            return false;
        } catch (e) {
            print(`Error adding image: ${e}`);
            return false;
        }
    }

    async addPdf(path, name = '') {
        const id = this.#pdfsJson.length;
        const thumbnailName = `${GLib.uuid_string_random()}.jpg`;
        const thumbnailPath = GLib.build_filenamev([this.#pdfThumbnailsDir, thumbnailName]);
        
        // Generate thumbnail
        await this.#generatePdfThumbnail(path, thumbnailPath);
        
        const pdf = {
            id,
            path,
            name: name || path.split('/').pop(),
            type: 'pdf',
            thumbnail: thumbnailPath,
            timestamp: GLib.DateTime.new_now_local().format('%Y-%m-%d %H:%M'),
        };
        
        this.#pdfsJson.push(pdf);
        Utils.writeFile(JSON.stringify(this.#pdfsJson, null, 2), this.#pdfsFile)
            .catch(console.error);
        
        this.emit('changed');
        this.notify('pdfs_json');
        return id;
    }

    deletePdf(id) {
        if (id >= 0 && id < this.#pdfsJson.length) {
            const pdf = this.#pdfsJson[id];
            // Delete thumbnail if it exists
            if (pdf.thumbnail) {
                try {
                    Utils.exec(['rm', pdf.thumbnail]);
                } catch (e) {
                    console.error('Error deleting PDF thumbnail:', e);
                }
            }
            this.#pdfsJson.splice(id, 1);
            Utils.writeFile(JSON.stringify(this.#pdfsJson, null, 2), this.#pdfsFile)
                .catch(console.error);
            this.emit('changed');
            this.notify('pdfs_json');
        }
    }

    async #generatePdfThumbnail(pdfPath, thumbnailPath) {
        try {
            await Utils.execAsync([
                'pdftoppm', '-jpeg', '-f', '1', '-l', '1',
                '-scale-to', '200',
                pdfPath, thumbnailPath.replace('.jpg', '')
            ]);
            // pdftoppm adds -1.jpg to the filename, so we need to rename it
            const generatedPath = `${thumbnailPath.replace('.jpg', '')}-1.jpg`;
            await Utils.execAsync(['mv', generatedPath, thumbnailPath]);
            return true;
        } catch (e) {
            console.error('Error generating PDF thumbnail:', e);
            return false;
        }
    }

    async addVideo(path, name = '') {
        const id = this.#videosJson.length;
        const thumbnailName = `${GLib.uuid_string_random()}.jpg`;
        const thumbnailPath = GLib.build_filenamev([this.#thumbnailsDir, thumbnailName]);
        
        // Generate thumbnail
        await this.#generateThumbnail(path, thumbnailPath);
        
        const video = {
            id,
            path,
            name: name || path.split('/').pop(),
            type: 'video',
            thumbnail: thumbnailPath,
            timestamp: GLib.DateTime.new_now_local().format('%Y-%m-%d %H:%M'),
        };
        
        this.#videosJson.push(video);
        Utils.writeFile(JSON.stringify(this.#videosJson, null, 2), this.#videosFile)
            .catch(console.error);
        
        this.emit('changed');
        this.notify('videos_json');
        return id;
    }

    deleteVideo(id) {
        if (id >= 0 && id < this.#videosJson.length) {
            const video = this.#videosJson[id];
            // Delete thumbnail if it exists
            if (video.thumbnail) {
                try {
                    Utils.exec(['rm', video.thumbnail]);
                } catch (e) {
                    console.error('Error deleting thumbnail:', e);
                }
            }
            this.#videosJson.splice(id, 1);
            Utils.writeFile(JSON.stringify(this.#videosJson, null, 2), this.#videosFile)
                .catch(console.error);
            this.emit('changed');
            this.notify('videos_json');
        }
    }

    deleteImage(id) {
        if (id >= 0 && id < this.#imagesJson.length) {
            const image = this.#imagesJson[id];
            this.#imagesJson.splice(id, 1);
            Utils.writeFile(JSON.stringify(this.#imagesJson || []), this.#imagesFile)
                .catch(print);
            this.notify('images_json');
            this.#emitUpdated();
        }
    }

    async #generateThumbnail(videoPath, thumbnailPath) {
        try {
            await Utils.execAsync([
                'ffmpeg', '-y', '-i', videoPath,
                '-ss', '00:00:01',  // Take frame at 1 second
                '-vframes', '1',
                '-vf', 'scale=200:-1',  // Scale width to 200px, maintain aspect ratio
                thumbnailPath
            ]);
            return true;
        } catch (e) {
            console.error('Error generating thumbnail:', e);
            return false;
        }
    }

    #copyFile(source, dest) {
        try {
            const sourceFile = Gio.File.new_for_path(source);
            const destFile = Gio.File.new_for_path(dest);
            return sourceFile.copy(destFile, Gio.FileCopyFlags.OVERWRITE, null, null);
        } catch (e) {
            print(`Error copying file: ${e}`);
            return false;
        }
    }

    #deleteFile(path) {
        try {
            const file = Gio.File.new_for_path(path);
            return file.delete(null);
        } catch (e) {
            print(`Error deleting file: ${e}`);
            return false;
        }
    }

    edit(id, newContent) {
        if (id >= 0 && id < this.#todoJson.length) {
            this.#todoJson[id].content = newContent;
            Utils.writeFile(JSON.stringify(this.#todoJson || []), this.#todoFile)
                .catch(print);
            this.notify('todo_json');
            this.#emitUpdated();
        }
    }

    editNote(id, newContent) {
        if (id >= 0 && id < this.#notesJson.length) {
            this.#notesJson[id].content = newContent;
            Utils.writeFile(JSON.stringify(this.#notesJson || []), this.#notesFile)
                .catch(print);
            this.notify('notes_json');
            this.#emitUpdated();
        }
    }

    editImage(id, newPath) {
        if (id >= 0 && id < this.#imagesJson.length) {
            this.#imagesJson[id].path = newPath;
            Utils.writeFile(JSON.stringify(this.#imagesJson || []), this.#imagesFile)
                .catch(print);
            this.notify('images_json');
            this.#emitUpdated();
        }
    }

    editPdf(id, newPath) {
        if (id >= 0 && id < this.#pdfsJson.length) {
            this.#pdfsJson[id].path = newPath;
            Utils.writeFile(JSON.stringify(this.#pdfsJson || []), this.#pdfsFile)
                .catch(print);
            this.notify('pdfs_json');
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