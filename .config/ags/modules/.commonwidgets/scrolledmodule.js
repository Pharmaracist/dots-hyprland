import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import GLib from 'gi://GLib';
import userOptions from '../.configuration/user_options.js';

const { Box, Stack, EventBox } = Widget;

/**
 * Creates a module switcher with smooth transitions
 * @param {Object} props - Properties for the module switcher
 * @param {Array} props.children - Array of widgets to show
 * @param {string} [props.css] - Additional CSS for the container
 * @param {string} [props.className] - Additional class names for the container
 * @returns {import('types/widgets/box').default} The module switcher widget
 */
export default ({
    children = [],
    css = '',
    className = '',
}) => {
    // Filter out null/undefined children
    const validChildren = children.filter(Boolean);
    if (validChildren.length === 0) return null;

    let currentIndex = 0;
    let isTransitioning = false;
    const transition = userOptions.asyncGet().appearance.Scroll.transition || 'slide_up_down';
    const debounceMs = userOptions.asyncGet().appearance.Scroll.debounce || 100;

    const stack = Stack({
        transition,
        transitionDuration: debounceMs,
        homogeneous: true,
        vexpand: true,
        children: validChildren.map((child, i) => Box({
            // className: 'bar-group bar-group-standalone',
            // css: 'padding: 0 8px; margin: 1px 0;',
            child,
            name: i.toString(),
        })),
    });

    // Show first module
    stack.shown = '0';

    const handleScroll = (direction) => {
        if (isTransitioning) return;
        isTransitioning = true;

        if (direction === 'up') {
            currentIndex = (currentIndex - 1 + validChildren.length) % validChildren.length;
        } else {
            currentIndex = (currentIndex + 1) % validChildren.length;
        }
        stack.shown = currentIndex.toString();

        // Reset transitioning state after animation completes
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, debounceMs, () => {
            isTransitioning = false;
            return GLib.SOURCE_REMOVE;
        });
    };

    // Create event box for mouse wheel handling
    return EventBox({
        className: `module-switcher ${className}`,
        css: css || 'min-width: 2rem;',
        onScrollUp: () => handleScroll('up'),
        onScrollDown: () => handleScroll('down'),
        child: stack,
    });
};