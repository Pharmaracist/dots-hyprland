const { GLib, Gdk, Gtk } = imports.gi;
const Lang = imports.lang;
const Cairo = imports.cairo;
const Pango = imports.gi.Pango;
const PangoCairo = imports.gi.PangoCairo;
import App from 'resource:///com/github/Aylur/ags/app.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js'
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
const { Box, DrawingArea, EventBox } = Widget;
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';

const dummyWs = Box({ className: 'bar-ws' }); // Not shown. Only for getting size props
const dummyActiveWs = Box({ className: 'bar-ws bar-ws-active' }); // Not shown. Only for getting size props
const dummyOccupiedWs = Box({ className: 'bar-ws bar-ws-occupied' }); // Not shown. Only for getting size props

const mix = (value1, value2, perc) => {
    return value1 * perc + value2 * (1 - perc);
}

const getFontWeightName = (weight) => {
    switch (weight) {
        case Pango.Weight.ULTRA_LIGHT:
            return 'UltraLight';
        case Pango.Weight.LIGHT:
            return 'Light';
        case Pango.Weight.NORMAL:
            return 'Normal';
        case Pango.Weight.BOLD:
            return 'Bold';
        case Pango.Weight.ULTRA_BOLD:
            return 'UltraBold';
        case Pango.Weight.HEAVY:
            return 'Heavy';
        default:
            return 'Normal';
    }
}

const numberStyles = {
    roman: (num) => {
        const roman = {
            M: 1000, CM: 900, D: 500, CD: 400,
            C: 100, XC: 90, L: 50, XL: 40,
            X: 10, IX: 9, V: 5, IV: 4, I: 1
        };
        let str = '';
        for (let i of Object.keys(roman)) {
            const q = Math.floor(num / roman[i]);
            num -= q * roman[i];
            str += i.repeat(q);
        }
        return str;
    },
    arabic: (num) => {
        const arabicNums = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return num.toString().split('').map(n => arabicNums[parseInt(n)]).join('');
    },
    chinese: (num) => {
        const chineseNums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
        if (num <= 10) return chineseNums[num];
        if (num < 20) return chineseNums[10] + (num > 10 ? chineseNums[num - 10] : '');
        const tens = Math.floor(num / 10);
        const ones = num % 10;
        return chineseNums[tens] + chineseNums[10] + (ones > 0 ? chineseNums[ones] : '');
    },
    japanese: (num) => {
        const japaneseNums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
        if (num <= 10) return japaneseNums[num];
        if (num < 20) return japaneseNums[10] + (num > 10 ? japaneseNums[num - 10] : '');
        const tens = Math.floor(num / 10);
        const ones = num % 10;
        return japaneseNums[tens] + japaneseNums[10] + (ones > 0 ? japaneseNums[ones] : '');
    },
    korean: (num) => {
        const koreanNums = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십'];
        if (num <= 10) return koreanNums[num];
        if (num < 20) return koreanNums[10] + (num > 10 ? koreanNums[num - 10] : '');
        const tens = Math.floor(num / 10);
        const ones = num % 10;
        return koreanNums[tens] + koreanNums[10] + (ones > 0 ? koreanNums[ones] : '');
    },
    thai: (num) => {
        const thaiNums = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        return num.toString().split('').map(n => thaiNums[parseInt(n)]).join('');
    },
    devanagari: (num) => {
        const devanagariNums = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
        return num.toString().split('').map(n => devanagariNums[parseInt(n)]).join('');
    },
    bengali: (num) => {
        const bengaliNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return num.toString().split('').map(n => bengaliNums[parseInt(n)]).join('');
    },
    circled: (num) => {
        const circledNums = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
                            '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
        return num <= 20 ? circledNums[num] : num.toString();
    },
    negative_circled: (num) => {
        const negCircledNums = ['⓿', '❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽', '❾', '❿',
                               '⓫', '⓬', '⓭', '⓮', '⓯', '⓰', '⓱', '⓲', '⓳', '⓴'];
        return num <= 20 ? negCircledNums[num] : num.toString();
    },
    fullwidth: (num) => {
        const fullwidthNums = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９'];
        return num.toString().split('').map(n => fullwidthNums[parseInt(n)]).join('');
    },
    superscript: (num) => {
        const superNums = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];
        return num.toString().split('').map(n => superNums[parseInt(n)]).join('');
    },
    subscript: (num) => {
        const subNums = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
        return num.toString().split('').map(n => subNums[parseInt(n)]).join('');
    },
    dice: (num) => {
        const diceNums = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        return num <= 6 ? diceNums[num - 1] : num.toString();
    },
    braille: (num) => {
        const brailleNums = ['⠚', '⠁', '⠃', '⠉', '⠙', '⠑', '⠋', '⠛', '⠓', '⠊'];
        return num.toString().split('').map(n => brailleNums[parseInt(n)]).join('');
    },
    numeric: (num) => num.toString(),
    dot: () => '•',
    square: () => '■',
    diamond: () => '◆',
    triangle: () => '▲',
    custom: (num, customLabels) => customLabels[num] || num.toString()
};

const getWorkspaceLabel = (wsId, style, customLabels = {}) => {
    if (style in numberStyles) {
        return numberStyles[style](wsId);
    }
    if (style === 'custom' && customLabels) {
        return numberStyles.custom(wsId, customLabels);
    }
    return numberStyles.numeric(wsId);
};

// Font size = workspace id
const WorkspaceContents = (count = 10) => {
    const area = DrawingArea({
        className: 'bar-ws-container',
        attribute: {
            initialized: false,
            workspaceMask: 0,
            workspaceGroup: 0,
            disconnectHooks: [],
            updateMask: (self) => {
                if (self._destroyed) return;
                const offset = Math.floor((Hyprland.active.workspace.id - 1) / count) * userOptions.asyncGet().workspaces.shown;
                const workspaces = Hyprland.workspaces;
                let workspaceMask = 0;
                for (let i = 0; i < workspaces.length; i++) {
                    const ws = workspaces[i];
                    if (ws.id <= offset || ws.id > offset + count) continue;
                    if (workspaces[i].windows > 0)
                        workspaceMask |= (1 << (ws.id - offset));
                }
                self.attribute.workspaceMask = workspaceMask;
                self.queue_draw();
            },
            toggleMask: (self, occupied, name) => {
                if (self._destroyed) return;
                if (occupied) self.attribute.workspaceMask |= (1 << parseInt(name));
                else self.attribute.workspaceMask &= ~(1 << parseInt(name));
                self.queue_draw();
            },
        }
    });

    area._destroyed = false;

    const wsHook = area.hook(Hyprland.active.workspace, (self) => {
        if (self._destroyed) return;
        self.setCss(`font-size: ${(Hyprland.active.workspace.id - 1) % count + 1}px;`);
        const previousGroup = self.attribute.workspaceGroup;
        const currentGroup = Math.floor((Hyprland.active.workspace.id - 1) / count);
        if (currentGroup !== previousGroup) {
            self.attribute.updateMask(self);
            self.attribute.workspaceGroup = currentGroup;
        }
    });

    const wsNotifyHook = area.hook(Hyprland, (self) => {
        if (self._destroyed) return;
        self.attribute.updateMask(self);
    }, 'notify::workspaces');

    area.attribute.disconnectHooks.push(wsHook, wsNotifyHook);

    area.connect('destroy', () => {
        area._destroyed = true;
        area.attribute.disconnectHooks.forEach(hook => {
            if (hook && typeof hook.disconnect === 'function') {
                try {
                    hook.disconnect();
                } catch (err) {
                    console.error('Error disconnecting hook:', err);
                }
            }
        });
        area.attribute.disconnectHooks = [];
    });

    area.connect('unrealize', () => {
        area._destroyed = true;
    });

    area.on('draw', Lang.bind(area, (area, cr) => {
        const offset = Math.floor((Hyprland.active.workspace.id - 1) / count) * userOptions.asyncGet().workspaces.shown;

        const allocation = area.get_allocation();
        const { width, height } = allocation;

        const workspaceStyleContext = dummyWs.get_style_context();
        const workspaceDiameter = workspaceStyleContext.get_property('min-width', Gtk.StateFlags.NORMAL);
        const workspaceRadius = workspaceDiameter / 2;
        const workspaceFontSize = workspaceStyleContext.get_property('font-size', Gtk.StateFlags.NORMAL) * 0.8;
        const workspaceFontFamily = workspaceStyleContext.get_property('font-family', Gtk.StateFlags.NORMAL);
        const workspaceFontWeight = workspaceStyleContext.get_property('font-weight', Gtk.StateFlags.NORMAL);
        const wsbg = workspaceStyleContext.get_property('background-color', Gtk.StateFlags.NORMAL);
        const wsfg = workspaceStyleContext.get_property('color', Gtk.StateFlags.NORMAL);

        const occupiedWorkspaceStyleContext = dummyOccupiedWs.get_style_context();
        const occupiedbg = occupiedWorkspaceStyleContext.get_property('background-color', Gtk.StateFlags.NORMAL);
        const occupiedfg = occupiedWorkspaceStyleContext.get_property('color', Gtk.StateFlags.NORMAL);

        const activeWorkspaceStyleContext = dummyActiveWs.get_style_context();
        const activebg = activeWorkspaceStyleContext.get_property('background-color', Gtk.StateFlags.NORMAL);
        const activefg = activeWorkspaceStyleContext.get_property('color', Gtk.StateFlags.NORMAL);
        area.set_size_request(workspaceDiameter * count, -1);
        const widgetStyleContext = area.get_style_context();
        const activeWs = widgetStyleContext.get_property('font-size', Gtk.StateFlags.NORMAL);

        const activeWsCenterX = -(workspaceDiameter / 2) + (workspaceDiameter * activeWs);
        const activeWsCenterY = height / 2;

        // Font
        const layout = PangoCairo.create_layout(cr);
        const fontDesc = Pango.font_description_from_string(`${workspaceFontFamily[0]}, Noto Sans CJK JP ${getFontWeightName(workspaceFontWeight)} ${workspaceFontSize}`);
        layout.set_font_description(fontDesc);
        cr.setAntialias(Cairo.Antialias.BEST);
        // Get kinda min radius for number indicators
        layout.set_text("0".repeat(count.toString().length), -1);
        const [layoutWidth, layoutHeight] = layout.get_pixel_size();
        const indicatorRadius = Math.max(layoutWidth, layoutHeight) / 2 * 1.15; // smaller than sqrt(2)*radius
        const indicatorGap = workspaceRadius - indicatorRadius;

        for (let i = 1; i <= count; i++) {
            if (area.attribute.workspaceMask & (1 << i)) {
                // Draw bg highlight
                cr.setSourceRGBA(occupiedbg.red, occupiedbg.green, occupiedbg.blue, occupiedbg.alpha);
                const wsCenterX = -(workspaceRadius) + (workspaceDiameter * i);
                const wsCenterY = height / 2;
                if (!(area.attribute.workspaceMask & (1 << (i - 1)))) { // Left
                    cr.arc(wsCenterX, wsCenterY, workspaceRadius, 0.5 * Math.PI, 1.5 * Math.PI);
                    cr.fill();
                }
                else {
                    cr.rectangle(wsCenterX - workspaceRadius, wsCenterY - workspaceRadius, workspaceRadius, workspaceRadius * 2)
                    cr.fill();
                }
                if (!(area.attribute.workspaceMask & (1 << (i + 1)))) { // Right
                    cr.arc(wsCenterX, wsCenterY, workspaceRadius, -0.5 * Math.PI, 0.5 * Math.PI);
                    cr.fill();
                }
                else {
                    cr.rectangle(wsCenterX, wsCenterY - workspaceRadius, workspaceRadius, workspaceRadius * 2)
                    cr.fill();
                }
            }
        }

        // Draw active ws
        cr.setSourceRGBA(activebg.red, activebg.green, activebg.blue, activebg.alpha);
        cr.arc(activeWsCenterX, activeWsCenterY, indicatorRadius, 0, 2 * Math.PI);
        cr.fill();

        // Draw workspace numbers
        for (let i = 1; i <= count; i++) {
            const inactivecolors = area.attribute.workspaceMask & (1 << i) ? occupiedfg : wsfg;
            if (i == activeWs) {
                cr.setSourceRGBA(activefg.red, activefg.green, activefg.blue, activefg.alpha);
            }
            // Moving to
            else if ((i == Math.floor(activeWs) && Hyprland.active.workspace.id < activeWs) || (i == Math.ceil(activeWs) && Hyprland.active.workspace.id > activeWs)) {
                cr.setSourceRGBA(mix(activefg.red, inactivecolors.red, 1 - Math.abs(activeWs - i)), mix(activefg.green, inactivecolors.green, 1 - Math.abs(activeWs - i)), mix(activefg.blue, inactivecolors.blue, 1 - Math.abs(activeWs - i)), activefg.alpha);
            }
            // Moving from
            else if ((i == Math.floor(activeWs) && Hyprland.active.workspace.id > activeWs) || (i == Math.ceil(activeWs) && Hyprland.active.workspace.id < activeWs)) {
                cr.setSourceRGBA(mix(activefg.red, inactivecolors.red, 1 - Math.abs(activeWs - i)), mix(activefg.green, inactivecolors.green, 1 - Math.abs(activeWs - i)), mix(activefg.blue, inactivecolors.blue, 1 - Math.abs(activeWs - i)), activefg.alpha);
            }
            // Inactive
            else
                cr.setSourceRGBA(inactivecolors.red, inactivecolors.green, inactivecolors.blue, inactivecolors.alpha);

            // Get workspace label based on style
            const wsOptions = userOptions.asyncGet().workspaces;
            const wsId = i + offset;
            const style = wsOptions.style || 'numeric';
            const label = getWorkspaceLabel(wsId, style, wsOptions.labels);

            layout.set_text(label, -1);
            const [layoutWidth, layoutHeight] = layout.get_pixel_size();
            const x = -workspaceRadius + (workspaceDiameter * i) - (layoutWidth / 2);
            const y = (height - layoutHeight) / 2;
            cr.moveTo(x, y);
            PangoCairo.show_layout(cr, layout);
            cr.stroke();
        }
    }));

    return area;
}

export default () => EventBox({
    child: Box({
        homogeneous: true,
        className: 'bar-group-margin',
        children: [Box({
            // className: 'bar-group bar-group-standalone bar-group-pad',
            css: 'min-width: 2px;',
            children: [WorkspaceContents(userOptions.asyncGet().workspaces.shown)],
        })]
    }),
    setup: (self) => {
        self.add_events(Gdk.EventMask.POINTER_MOTION_MASK);
        self.on('motion-notify-event', (self, event) => {
            if (!self.attribute.clicked) return;
            const [_, cursorX, cursorY] = event.get_coords();
            const widgetWidth = self.get_allocation().width;
            const wsId = Math.ceil(cursorX * userOptions.asyncGet().workspaces.shown / widgetWidth);
            Utils.execAsync([`${App.configDir}/scripts/hyprland/workspace_action.sh`, 'workspace', `${wsId}`])
                .catch(print);
        })
        self.on('button-press-event', (self, event) => {
            if (event.get_button()[1] === 1) {
                self.attribute.clicked = true;
                const [_, cursorX, cursorY] = event.get_coords();
                const widgetWidth = self.get_allocation().width;
                const wsId = Math.ceil(cursorX * userOptions.asyncGet().workspaces.shown / widgetWidth);
                Utils.execAsync([`${App.configDir}/scripts/hyprland/workspace_action.sh`, 'workspace', `${wsId}`])
                    .catch(print);
            }
            else if (event.get_button()[1] === 8) {
                Hyprland.messageAsync(`dispatch togglespecialworkspace`).catch(print);
            }
        })
        self.on('button-release-event', (self) => self.attribute.clicked = false);
    }
})
