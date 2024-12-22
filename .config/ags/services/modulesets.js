import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

class ModuleSetsService extends Service {
    static {
        Service.register(this, {}, {
            'currentSet': ['int'],
        });
    }

    #currentSet = 0;
    #totalSets = 2; // Adjust based on how many sets you want

    constructor() {
        super();
        
        // Initialize with first set
        this.#currentSet = 0;
        this.emit('changed');
    }

    get currentSet() { return this.#currentSet; }

    nextSet() {
        this.#currentSet = (this.#currentSet + 1) % this.#totalSets;
        this.emit('changed');
    }

    previousSet() {
        this.#currentSet = (this.#currentSet - 1 + this.#totalSets) % this.#totalSets;
        this.emit('changed');
    }
}

const service = new ModuleSetsService();
export default service;
