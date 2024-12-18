import Media from './services/media.js';
import App from 'resource:///com/github/Aylur/ags/app.js';

// Listen to all events
Media.connect('song-changed', (_, song) => {
    console.log('Song changed:', song || 'No song playing');
});

Media.connect('player-changed', (_, state) => {
    console.log('Player state changed:', state);
});

Media.connect('songs-updated', (_, songs) => {
    console.log('Songs list updated. Found', songs.length, 'songs');
});

// Test the service when config is parsed
App.connect('config-parsed', () => {
    console.log('Testing Media Service...');
    console.log('Media directory:', Media.mediaDirectory);
    
    // Wait for initial scan
    setTimeout(async () => {
        if (Media.songs.length > 0) {
            console.log('\nStarting playback test:');
            console.log('Playing first song:', Media.songs[0]);
            await Media.play(Media.songs[0]);
            
            // Stop after 5 seconds
            setTimeout(async () => {
                console.log('\nTesting stop functionality:');
                await Media.stop();
                
                // Exit after testing
                setTimeout(() => {
                    console.log('\nTest complete. Exiting...');
                    App.quit();
                }, 1000);
            }, 5000);
        } else {
            console.log('No songs found in Music directory');
            App.quit();
        }
    }, 1000);
});

// Export an empty window to satisfy AGS
export default { windows: [] };
