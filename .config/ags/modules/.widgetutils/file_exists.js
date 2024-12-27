import GLib from 'gi://GLib';

export function fileExists(path) {
    try {
        return GLib.file_test(path, GLib.FileTest.EXISTS);
    } catch (error) {
        console.error(`Error checking if file exists at ${path}:`, error);
        return false;
    }
}
