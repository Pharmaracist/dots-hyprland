import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

// Read and parse config.json
const readConfig = () => {
    try {
        const configPath = Utils.HOME + '/.config/ags/config.json';
        const contents = Utils.readFile(configPath);
        return JSON.parse(contents);
    } catch (error) {
        console.error('Failed to read config:', error);
        return {};
    }
};

// Get config value with default fallback
export const getConfig = (path, defaultValue = null) => {
    const config = readConfig();
    const parts = path.split('.');
    let current = config;

    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            return defaultValue;
        }
    }

    return current ?? defaultValue;
};

export default { getConfig };
