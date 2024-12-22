const { Gio, GLib } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

const ColorBox = ({
    name = '',
    colorClass = '',
    ...rest
}) => Widget.Box({
    ...rest,
    className: `colorscheme-box ${colorClass}`,
    homogeneous: true,
    children: [
        Widget.Label({
            label: `${name}`,
            className: 'txt-smallie',
        })
    ]
});

export default () => Widget.Box({
    className: 'bar-colorscheme-module spacing-h-5',
    homogeneous: false,
    children: [
        ColorBox({ name: '1', colorClass: 'color-1' }),
        ColorBox({ name: '1', colorClass: 'color-2' }),
        ColorBox({ name: '2', colorClass: 'color-3' }),
        ColorBox({ name: '2', colorClass: 'color-4' }),
        ColorBox({ name: '3', colorClass: 'color-5' }),
        ColorBox({ name: '3', colorClass: 'color-6' }),
        ColorBox({ name: 'Sf', colorClass: 'color-surface' }),
        ColorBox({ name: 'Sf', colorClass: 'color-surface-dim' }),
        ColorBox({ name: 'Bg', colorClass: 'color-bg' }),
        ColorBox({ name: 'IP', colorClass: 'color-primary' }),
    ]
});
