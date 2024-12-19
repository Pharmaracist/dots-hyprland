import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { execAsync } = Utils;

class AutoCpuFreqService extends Service {
    static {
        Service.register(this, {
            'active-profile-changed': ['string'],
        });
    }

    #activeProfile = 'balanced';
    #profiles = ['power-saver', 'balanced', 'performance'];
    #updateInterval;

    constructor() {
        super();
        this.#updateProfile();
        
        // Set up periodic updates to check current profile
        this.#updateInterval = setInterval(() => {
            this.#updateProfile();
        }, 2000);
    }

    get active_profile() { return this.#activeProfile; }
    set active_profile(value) {
        if (this.#profiles.includes(value)) {
            this.#applyProfile(value);
        }
    }

    get profiles() { return this.#profiles; }

    async #updateProfile() {
        try {
            const governor = await execAsync(['cat', '/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor']);
            const govStr = governor.trim();
            
            let newProfile;
            if (govStr === 'powersave') {
                newProfile = 'power-saver';
            } else if (govStr === 'performance') {
                newProfile = 'performance';
            } else {
                newProfile = 'balanced';
            }

            if (this.#activeProfile !== newProfile) {
                this.#activeProfile = newProfile;
                this.emit('active-profile-changed', this.#activeProfile);
            }
        } catch (error) {
            console.error('Error reading CPU governor:', error);
        }
    }

    async #applyProfile(profile) {
        try {
            await execAsync(['sudo', 'auto-cpufreq', '--force', profile]);
            this.#activeProfile = profile;
            this.emit('active-profile-changed', this.#activeProfile);
        } catch (error) {
            console.error('Error applying CPU profile:', error);
        }
    }

    destroy() {
        if (this.#updateInterval) {
            clearInterval(this.#updateInterval);
        }
        super.destroy();
    }
}

// Export the service
const service = new AutoCpuFreqService();
export default service;
