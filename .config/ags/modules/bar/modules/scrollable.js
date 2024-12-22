import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Service from 'resource:///com/github/Aylur/ags/service.js';
import { getConfig } from '../../../utils/config.js';
import { debounce } from '../../../utils/debounce.js';

const { Box, EventBox, Stack } = Widget;

// Get config values with defaults
const SCROLL_DURATION = getConfig('bar.animations.scroll.duration', 200);
const SCROLL_DEBOUNCE = getConfig('bar.animations.scroll.debounce', 150);

class ModuleSetManager extends Service {
    static {
        Service.register(this);
    }

    #currentSet = 0;
    #maxSets;

    constructor(maxSets) {
        super();
        this.#maxSets = maxSets;
    }

    get currentSet() {
        return this.#currentSet;
    }

    nextSet() {
        this.#currentSet = (this.#currentSet + 1) % this.#maxSets;
        this.emit('changed');
    }

    previousSet() {
        this.#currentSet = (this.#currentSet - 1 + this.#maxSets) % this.#maxSets;
        this.emit('changed');
    }
}

// Main scrollable container that manages different module sets
const ScrollableContainer = ({ sets, name = 'default' }) => {
    // Create a unique ModuleSet instance for this container
    const moduleSet = new ModuleSetManager(sets.length);

    // Create the stack to hold our sets
    const stack = Stack({
        transition: 'slide_up_down',
        transitionDuration: SCROLL_DURATION,
        items: sets.map((children, index) => [
            `${name}-set-${index}`,
            Box({
                children,
            }),
        ]),
    });

    // Set initial state
    stack.shown = `${name}-set-0`;

    // Debounced scroll handlers
    const handleScrollUp = debounce(() => {
        moduleSet.previousSet();
    }, SCROLL_DEBOUNCE);

    const handleScrollDown = debounce(() => {
        moduleSet.nextSet();
    }, SCROLL_DEBOUNCE);

    // Create the main widget with scroll handling
    const widget = EventBox({
        onScrollUp: handleScrollUp,
        onScrollDown: handleScrollDown,
        child: Box({
            css: 'min-height: 1.5em;',
            children: [stack],
        }),
    });

    // Update visible set when changed
    widget.hook(moduleSet, (self, currentSet) => {
        stack.shown = `${name}-set-${moduleSet.currentSet}`;
    }, 'changed');

    return widget;
};

export default ScrollableContainer;
