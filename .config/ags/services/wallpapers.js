import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import GdkPixbuf from 'gi://GdkPixbuf';
const { execAsync } = Utils;

class WallpaperService extends Service {
    static {
        GObject.registerClass({
            Properties: {
                'loading': GObject.ParamSpec.boolean(
                    'loading', 'loading', 'loading',
                    GObject.ParamFlags.READWRITE,
                    false,
                ),
            },
            Signals: {
                'preview-ready': { param_types: [GObject.TYPE_STRING] },
                'error': { param_types: [GObject.TYPE_STRING] },
                'loading': { param_types: [] },
            },
        }, this);
    }

    _loading = false;
    get loading() { return this._loading; }
    set loading(value) {
        this._loading = value;
        this.notify('loading');
        this.emit('loading');
    }

    generateWallpaper(prompt) {
        this.loading = true;
        
        return new Promise((resolve, reject) => {
            const tempDir = '/tmp/ags-wallpapers';
            const tempFile = `${tempDir}/preview_${Date.now()}.png`;
            
            // Enhance the prompt with quality parameters
            const enhancedPrompt = `${prompt}, 4k, ultra detailed, high quality, masterpiece`;
            
            // Create temp directory first
            execAsync(['mkdir', '-p', tempDir])
                .then(() => {
                    // Then download the image with specific parameters
                    const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(enhancedPrompt) + 
                              '?width=3840&height=2160&nologo=true&seed=' + Date.now();
                    return execAsync(['curl', '-L', url, '-o', tempFile]);
                })
                .then(() => {
                    this.emit('preview-ready', tempFile);
                    resolve(tempFile);
                })
                .catch(error => {
                    console.error('Error generating wallpaper:', error);
                    this.emit('error', error.message);
                    reject(error);
                })
                .finally(() => {
                    this.loading = false;
                });
        });
    }

    async saveWallpaper(tempFile) {
        const targetDir = `${Utils.HOME}/Pictures/Wallpapers`;
        const targetFile = `${targetDir}/pollinations_${Date.now()}.png`;
        
        try {
            await execAsync(['mkdir', '-p', targetDir]);
            await execAsync(['cp', tempFile, targetFile]);
            return targetFile;
        } catch (error) {
            console.error('Error saving wallpaper:', error);
            throw error;
        }
    }

    async setWallpaper(file) {
        try {
            // First save the wallpaper if it's a temp file
            let wallpaperPath = file;
            if (file.startsWith('/tmp/')) {
                wallpaperPath = await this.saveWallpaper(file);
            }
            
            // Use switchwall.sh to set the wallpaper
            const scriptPath = `${Utils.HOME}/dots-hyprland/.config/ags/scripts/color_generation/switchwall.sh`;
            console.log('Setting wallpaper with:', scriptPath, wallpaperPath);
            
            const result = await execAsync([scriptPath, wallpaperPath], {
                stderr: 'pipe',
                stdout: 'pipe'
            });
            
            console.log('Switchwall output:', result);
            return wallpaperPath;
        } catch (error) {
            console.error('Error setting wallpaper. Full error:', error);
            console.error('Error command:', error.cmd);
            console.error('Error output:', error.stderr);
            throw new Error(`Failed to set wallpaper: ${error.stderr || error.message}`);
        }
    }

    async setAsProfilePhoto(file) {
        try {
            // First save the image if it's a temp file
            let imagePath = file;
            if (file.startsWith('/tmp/')) {
                const targetDir = `${Utils.HOME}/Pictures/ProfilePhotos`;
                const targetFile = `${targetDir}/pollinations_${Date.now()}.png`;
                await execAsync(['mkdir', '-p', targetDir]);
                await execAsync(['cp', file, targetFile]);
                imagePath = targetFile;
            }
            
            // Use set_profile_photo.sh to set the profile photo
            const scriptPath = `${Utils.HOME}/.config/ags/scripts/set_profile_photo.sh`;
            console.log('Setting profile photo with:', scriptPath, imagePath);
            
            const result = await execAsync([scriptPath, imagePath], {
                stderr: 'pipe',
                stdout: 'pipe'
            });
            
            console.log('Set profile photo output:', result);
            return imagePath;
        } catch (error) {
            console.error('Error setting profile photo. Full error:', error);
            console.error('Error command:', error.cmd);
            console.error('Error output:', error.stderr);
            throw error;
        }
    }
}

export default new WallpaperService();
