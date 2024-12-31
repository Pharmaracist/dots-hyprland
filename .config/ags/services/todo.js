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
            'music_json': ['jsobject'],
            'gemini_content': ['jsobject'],
        }, {
            'todo_json': ['jsobject', 'rw'],
            'notes_json': ['jsobject', 'rw'],
            'images_json': ['jsobject', 'rw'],
            'pdfs_json': ['jsobject', 'rw'],
            'videos_json': ['jsobject', 'rw'],
            'music_json': ['jsobject', 'rw'],
            'gemini_content': ['jsobject', 'r'],
        });
    }

    #todoFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'todo.json']);
    #notesFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'notes.json']);
    #imagesFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'images.json']);
    #pdfsFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'pdfs.json']);
    #videosFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'videos.json']);
    #musicFile = GLib.build_filenamev([GLib.get_user_state_dir(), 'ags', 'music.json']);
    #imagesDir = GLib.build_filenamev([GLib.get_home_dir(), 'ags', 'Dashboard', 'images']);
    #pdfsDir = GLib.build_filenamev([GLib.get_home_dir(), 'ags', 'Dashboard', 'pdf']);
    #pdfThumbnailsDir = GLib.build_filenamev([GLib.get_home_dir(), 'ags', 'Dashboard', 'pdf', 'thumbnails']);
    #videosDir = GLib.build_filenamev([GLib.get_home_dir(), 'ags', 'Dashboard', 'videos']);
    #thumbnailsDir = GLib.build_filenamev([GLib.get_home_dir(), 'ags', 'Dashboard', 'videos', 'thumbnails']);
    #musicDir = GLib.build_filenamev([GLib.get_home_dir(), 'ags', 'Dashboard', 'music']);
    #musicThumbnailsDir = GLib.build_filenamev([GLib.get_home_dir(), 'ags', 'Dashboard', 'music', 'thumbnails']);
    #todoMdFile = GLib.build_filenamev([GLib.get_home_dir(), 'Documents/obsidian/todo.md']);
    #notesMdFile = GLib.build_filenamev([GLib.get_home_dir(), 'Documents/obsidian/notes.md']);
    #todoJson = [];
    #notesJson = [];
    #imagesJson = [];
    #pdfsJson = [];
    #videosJson = [];
    #musicJson = [];
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

        try {
            const musicFileContent = Utils.readFile(this.#musicFile);
            this.#musicJson = musicFileContent ? JSON.parse(musicFileContent) : [];
        } catch (e) {
            this.#musicJson = [];
            Utils.writeFile('[]', this.#musicFile).catch(print);
        }

        // Create directories if they don't exist
        Utils.ensureDirectory(GLib.build_filenamev([GLib.get_user_state_dir(), 'ags']));
        Utils.ensureDirectory(this.#imagesDir);
        Utils.ensureDirectory(this.#pdfsDir);
        Utils.ensureDirectory(this.#pdfThumbnailsDir);
        Utils.ensureDirectory(this.#videosDir);
        Utils.ensureDirectory(this.#thumbnailsDir);
        Utils.ensureDirectory(this.#musicDir);
        Utils.ensureDirectory(this.#musicThumbnailsDir);

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

        // Scan existing files in directories
        this.#scanDirectories();

        // Monitor media directories
        this.#monitorDirectory(this.#pdfsDir, async (file) => {
            if (file.get_basename().endsWith('.pdf')) {
                await this.addPdf(file.get_path());
            }
        });

        this.#monitorDirectory(this.#imagesDir, async (file) => {
            const name = file.get_basename().toLowerCase();
            if (name.endsWith('.png') || name.endsWith('.jpg') || 
                name.endsWith('.jpeg') || name.endsWith('.gif') || 
                name.endsWith('.webp')) {
                await this.addImage(file.get_path());
            }
        });

        this.#monitorDirectory(this.#videosDir, async (file) => {
            const name = file.get_basename().toLowerCase();
            if (name.endsWith('.mp4') || name.endsWith('.mkv') || 
                name.endsWith('.webm') || name.endsWith('.avi') || 
                name.endsWith('.mov')) {
                await this.addVideo(file.get_path());
            }
        });

        this.#monitorDirectory(this.#musicDir, async (file) => {
            const name = file.get_basename().toLowerCase();
            if (name.endsWith('.mp3') || name.endsWith('.m4a') || 
                name.endsWith('.ogg') || name.endsWith('.flac') || 
                name.endsWith('.wav')) {
                await this.addMusic(file.get_path());
            }
        });

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

    get music_json() { return this.#musicJson }
    set music_json(value) {
        this.#musicJson = value;
        Utils.writeFile(JSON.stringify(value, null, 2), this.#musicFile)
            .catch(console.error);
        this.emit('changed');
        this.notify('music_json');
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

        const music = this.#musicJson
            .map(music => `- ${music.name}`)
            .join('\n');

        return {
            todos: todos || 'No tasks',
            notes: notes || 'No notes',
            images: images || 'No images',
            pdfs: pdfs || 'No PDFs',
            videos: videos || 'No videos',
            music: music || 'No music',
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

    async rescan() {
        await this.#scanDirectories();
        this.#emitUpdated();
    }

    #monitorDirectory(path, callback) {
        const dir = Gio.File.new_for_path(path);
        const monitor = dir.monitor_directory(Gio.FileMonitorFlags.NONE, null);
        
        monitor.connect('changed', (_, file, otherFile, eventType) => {
            if (eventType === Gio.FileMonitorEvent.CREATED) {
                callback(file);
            }
        });
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

    async #scanDirectories() {
        // Scan PDFs
        try {
            console.log('Scanning PDF directory:', this.#pdfsDir);
            const dir = Gio.File.new_for_path(this.#pdfsDir);
            const enumerator = dir.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NONE, null);
            let fileInfo;
            while ((fileInfo = enumerator.next_file(null)) !== null) {
                const name = fileInfo.get_name();
                if (name.endsWith('.pdf')) {
                    const path = GLib.build_filenamev([this.#pdfsDir, name]);
                    const exists = this.#pdfsJson.some(pdf => pdf.path === path);
                    if (!exists) {
                        await this.addPdf(path);
                    }
                }
            }
        } catch (e) {
            console.error('Error scanning PDF directory:', e);
        }

        // Scan Images
        try {
            console.log('Scanning Images directory:', this.#imagesDir);
            const dir = Gio.File.new_for_path(this.#imagesDir);
            const enumerator = dir.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NONE, null);
            let fileInfo;
            while ((fileInfo = enumerator.next_file(null)) !== null) {
                const name = fileInfo.get_name().toLowerCase();
                if (name.endsWith('.png') || name.endsWith('.jpg') || 
                    name.endsWith('.jpeg') || name.endsWith('.gif') || 
                    name.endsWith('.webp')) {
                    const path = GLib.build_filenamev([this.#imagesDir, fileInfo.get_name()]);
                    const exists = this.#imagesJson.some(img => img.path === path);
                    if (!exists) {
                        await this.addImage(path);
                    }
                }
            }
        } catch (e) {
            console.error('Error scanning Images directory:', e);
        }

        // Scan Videos
        try {
            console.log('Scanning Videos directory:', this.#videosDir);
            const dir = Gio.File.new_for_path(this.#videosDir);
            const enumerator = dir.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NONE, null);
            let fileInfo;
            while ((fileInfo = enumerator.next_file(null)) !== null) {
                const name = fileInfo.get_name().toLowerCase();
                if (name.endsWith('.mp4') || name.endsWith('.mkv') || 
                    name.endsWith('.webm') || name.endsWith('.avi') || 
                    name.endsWith('.mov')) {
                    const path = GLib.build_filenamev([this.#videosDir, fileInfo.get_name()]);
                    const exists = this.#videosJson.some(video => video.path === path);
                    if (!exists) {
                        await this.addVideo(path);
                    }
                }
            }
        } catch (e) {
            console.error('Error scanning Videos directory:', e);
        }

        // Scan Music
        try {
            console.log('Scanning Music directory:', this.#musicDir);
            const dir = Gio.File.new_for_path(this.#musicDir);
            const enumerator = dir.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NONE, null);
            let fileInfo;
            while ((fileInfo = enumerator.next_file(null)) !== null) {
                const name = fileInfo.get_name().toLowerCase();
                if (name.endsWith('.mp3') || name.endsWith('.m4a') || 
                    name.endsWith('.ogg') || name.endsWith('.flac') || 
                    name.endsWith('.wav')) {
                    const path = GLib.build_filenamev([this.#musicDir, fileInfo.get_name()]);
                    const exists = this.#musicJson.some(music => music.path === path);
                    if (!exists) {
                        await this.addMusic(path);
                    }
                }
            }
        } catch (e) {
            console.error('Error scanning Music directory:', e);
        }
    }

    async addMusic(sourcePath) {
        const fileName = GLib.path_get_basename(sourcePath);
        const destPath = GLib.build_filenamev([this.#musicDir, fileName]);
        const thumbnailPath = GLib.build_filenamev([this.#musicThumbnailsDir, `${GLib.path_get_basename(sourcePath)}.jpg`]);

        // Copy file if it's not already in the music directory
        if (sourcePath !== destPath) {
            if (!this.#copyFile(sourcePath, destPath)) {
                return;
            }
        }

        // Generate thumbnail using ffmpeg
        await this.#generateMusicThumbnail(destPath, thumbnailPath);

        // Add to JSON
        this.#musicJson = [
            ...this.#musicJson,
            {
                path: destPath,
                name: fileName,
                thumbnail: thumbnailPath,
            },
        ];

        Utils.writeFile(JSON.stringify(this.#musicJson || []), this.#musicFile)
            .catch(print);
        this.notify('music_json');
        this.#emitUpdated();
    }

    deleteMusic(id) {
        if (id >= 0 && id < this.#musicJson.length) {
            const music = this.#musicJson[id];
            this.#deleteFile(music.path);
            if (music.thumbnail) {
                this.#deleteFile(music.thumbnail);
            }
            this.#musicJson.splice(id, 1);
            Utils.writeFile(JSON.stringify(this.#musicJson || []), this.#musicFile)
                .catch(print);
            this.notify('music_json');
            this.#emitUpdated();
        }
    }

    async #generatePdfThumbnail(pdfPath, thumbnailPath) {
        try {
            // First check if pdftoppm is available
            try {
                await Utils.execAsync(['which', 'pdftoppm']);
            } catch (e) {
                console.error('pdftoppm not found. Please install poppler-utils');
                return false;
            }

            // Generate thumbnail
            await Utils.execAsync([
                'pdftoppm', '-jpeg', '-f', '1', '-l', '1',
                '-scale-to', '200',
                pdfPath, thumbnailPath.replace('.jpg', '')
            ]);

            // pdftoppm adds -1.jpg to the filename, so we need to rename it
            const generatedPath = `${thumbnailPath.replace('.jpg', '')}-1.jpg`;
            
            // Check if the thumbnail was actually generated
            const file = Gio.File.new_for_path(generatedPath);
            if (!file.query_exists(null)) {
                console.error('Thumbnail was not generated');
                return false;
            }

            await Utils.execAsync(['mv', generatedPath, thumbnailPath]);
            return true;
        } catch (e) {
            console.error('Error generating PDF thumbnail:', e);
            return false;
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

    async #generateMusicThumbnail(musicPath, thumbnailPath) {
        try {
            // First check if ffmpeg is available
            try {
                await Utils.execAsync(['which', 'ffmpeg']);
            } catch (e) {
                console.error('ffmpeg not found. Please install ffmpeg');
                return false;
            }

            // Extract album art if available
            await Utils.execAsync([
                'ffmpeg', '-y',
                '-i', musicPath,
                '-an', // Disable audio
                '-vcodec', 'copy', // Copy video codec
                thumbnailPath
            ]).catch(async () => {
                // If no embedded art, create a default thumbnail
                await Utils.execAsync([
                    'convert',
                    '-size', '200x200',
                    'xc:none',
                    '-background', 'none',
                    '-fill', '#666666',
                    '-gravity', 'center',
                    '-pointsize', '72',
                    '-draw', 'text 0,0 "♪"',
                    thumbnailPath
                ]).catch(e => {
                    console.error('Error creating default music thumbnail:', e);
                    return false;
                });
            });

            return true;
        } catch (e) {
            console.error('Error generating music thumbnail:', e);
            return false;
        }
    }
}

// the singleton instance
const service = new TodoService();

// make it global for easy use with cli
globalThis.todo = service;

// export to use in other modules
export default service;