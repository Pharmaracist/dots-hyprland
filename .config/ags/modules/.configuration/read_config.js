import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { fileExists } from '../.widgetutils/file_exists.js';

let configCache = null;

export function readConfig() {
    if (configCache) return configCache;

    const defaultConfigPath = `${App.configDir}/modules/.configuration/user_options.default.json`;
    const userConfigPath = `${App.configDir}/modules/.configuration/user_options.json`;

    try {
        // Read default config first
        const defaultConfig = JSON.parse(Utils.readFile(defaultConfigPath));

        // Try to read user config and merge with default
        if (fileExists(userConfigPath)) {
            const userConfig = JSON.parse(Utils.readFile(userConfigPath));
            configCache = { ...defaultConfig, ...userConfig };
        } else {
            configCache = defaultConfig;
        }

        return configCache;
    } catch (error) {
        console.error('Error reading config:', error);
        return {};
    }
}
