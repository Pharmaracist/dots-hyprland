const { Gio, GLib } = imports.gi;
import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { exec, execAsync } = Utils;

class TimersService extends Service {
    static {
        Service.register(
            this,
            { 
                'updated': [],
                'timer-complete': ['string'],
            },
        );
    }

    _timers = new Map();
    _configPath = '';

    constructor() {
        super();

        this._configPath = `${GLib.get_user_config_dir()}/ags/user/timers.json`;

        // Ensure directory exists
        Utils.exec(`mkdir -p ${GLib.get_user_config_dir()}/ags/user`);

        // Load saved timers
        try {
            const content = Utils.readFile(this._configPath);
            const savedTimers = JSON.parse(content);
            savedTimers.forEach(timer => {
                this._timers.set(timer.id, {
                    ...timer,
                    running: false,
                    remaining: timer.duration,
                    interval: null,
                });
            });
        } catch {
            Utils.writeFile('[]', this._configPath);
        }
    }

    _save() {
        const timersArray = Array.from(this._timers.values()).map(timer => ({
            id: timer.id,
            name: timer.name,
            duration: timer.duration,
        }));
        Utils.writeFile(JSON.stringify(timersArray, null, 2), this._configPath);
    }

    addTimer(name, duration) {
        const id = `timer_${Date.now()}`;
        this._timers.set(id, {
            id,
            name,
            duration,
            running: false,
            remaining: duration,
            interval: null,
        });
        this._save();
        this.emit('updated');
        return id;
    }

    removeTimer(id) {
        const timer = this._timers.get(id);
        if (timer && timer.interval) {
            GLib.source_remove(timer.interval);
        }
        this._timers.delete(id);
        this._save();
        this.emit('updated');
    }

    startTimer(id) {
        const timer = this._timers.get(id);
        if (!timer || timer.running) return;

        timer.running = true;
        timer.interval = Utils.interval(1000, () => {
            timer.remaining--;
            this.emit('updated');

            if (timer.remaining <= 0) {
                this.stopTimer(id);
                this.emit('timer-complete', timer.name);
                return false;
            }
            return true;
        });
        this.emit('updated');
    }

    stopTimer(id) {
        const timer = this._timers.get(id);
        if (!timer || !timer.running) return;

        if (timer.interval) {
            GLib.source_remove(timer.interval);
        }
        timer.running = false;
        timer.interval = null;
        this.emit('updated');
    }

    resetTimer(id) {
        const timer = this._timers.get(id);
        if (!timer) return;

        this.stopTimer(id);
        timer.remaining = timer.duration;
        this.emit('updated');
    }

    getTimer(id) {
        return this._timers.get(id);
    }

    get timers() {
        return Array.from(this._timers.values());
    }
}

// the singleton instance
const service = new TimersService();

// make it global for easy use
globalThis.timers = service;

// export to use in other modules
export default service;
