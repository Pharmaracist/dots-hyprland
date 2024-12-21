import Widget from 'resource:///com/github/Aylur/ags/widget.js';
const { Gtk } = imports.gi;
const Lang = imports.lang;

export const RoundedCorner = (place, props) => Widget.DrawingArea({
    ...props,
    hpack: place.includes('left') ? 'start' : 'end',
    vpack: place.includes('top') ? 'start' : 'end',
    setup: (widget) => {
        let drawHandler = null;
        let styleTimeout = null;

        const setupDrawing = () => {
            // Clean up previous handler if it exists
            if (drawHandler) {
                widget.disconnect(drawHandler);
                drawHandler = null;
            }

            const c = widget.get_style_context().get_property('background-color', Gtk.StateFlags.NORMAL);
            const r = widget.get_style_context().get_property('border-radius', Gtk.StateFlags.NORMAL);
            widget.set_size_request(r, r);

            // Set up new draw handler
            drawHandler = widget.connect('draw', (widget, cr) => {
                const c = widget.get_style_context().get_property('background-color', Gtk.StateFlags.NORMAL);
                const r = widget.get_style_context().get_property('border-radius', Gtk.StateFlags.NORMAL);
                widget.set_size_request(r, r);

                switch (place) {
                    case 'topleft':
                        cr.arc(r, r, r, Math.PI, 3 * Math.PI / 2);
                        cr.lineTo(0, 0);
                        break;

                    case 'topright':
                        cr.arc(0, r, r, 3 * Math.PI / 2, 2 * Math.PI);
                        cr.lineTo(r, 0);
                        break;

                    case 'bottomleft':
                        cr.arc(r, 0, r, Math.PI / 2, Math.PI);
                        cr.lineTo(0, r);
                        break;

                    case 'bottomright':
                        cr.arc(0, 0, r, 0, Math.PI / 2);
                        cr.lineTo(r, r);
                        break;
                }

                cr.closePath();
                cr.setSourceRGBA(c.red, c.green, c.blue, c.alpha);
                cr.fill();
            });
        };

        // Set up initial drawing with a small delay
        styleTimeout = Utils.timeout(1, () => {
            setupDrawing();
            styleTimeout = null;
            return false; // Don't repeat
        });

        // Clean up on widget destroy
        widget.connect('destroy', () => {
            if (styleTimeout) {
                Utils.timeout.clearTimeout(styleTimeout);
                styleTimeout = null;
            }
            if (drawHandler) {
                try {
                    widget.disconnect(drawHandler);
                    drawHandler = null;
                } catch (error) {
                    console.error('Error cleaning up corner widget:', error);
                }
            }
        });
    },
});