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

const dummyWs = Box({ className: 'knoks-ws' }); // Not shown. Only for getting size props
const dummyActiveWs = Box({ className: 'knoks-ws knoks-ws-active' }); // Not shown. Only for getting size props
const dummyOccupiedWs = Box({ className: 'knoks-ws knoks-ws-occupied' }); // Not shown. Only for getting size props

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
        className: 'knoks-ws-container',
        attribute: {
            initialized: false,
            workspaceMask: 0,
            workspaceGroup: 0,
            disconnectHooks: [],
            updateMask: (self) => {
                const activeId = Hyprland.active.workspace.id;
                let newMask = 0;
                for (const ws of Hyprland.workspaces) {
                    if (ws.id >= 0 && ws.id < count) {
                        newMask |= (1 << ws.id);
                    }
                }
                if (newMask !== self.attribute.workspaceMask || activeId !== self.attribute.workspaceGroup) {
                    self.attribute.workspaceMask = newMask;
                    self.attribute.workspaceGroup = activeId;
                    self.queue_draw();
                }
            },
            setup: (self) => {
                const styleContext = self.get_style_context();
                const fontDesc = styleContext.get_property('font', Gtk.StateFlags.NORMAL);
                const fontFamily = fontDesc.get_family();
                const fontWeight = fontDesc.get_weight();
                const fontWeightName = getFontWeightName(fontWeight);
                const fontStyle = fontDesc.get_style() === Pango.Style.ITALIC ? 'italic' : 'normal';
                const fontSize = fontDesc.get_size() / Pango.SCALE;

                const layout = PangoCairo.create_layout(self._cr);
                layout.set_text('0', -1);
                const [_, rect] = layout.get_pixel_extents();
                const textHeight = rect.height;

                const margin = styleContext.get_margin(Gtk.StateFlags.NORMAL);
                const marginTop = margin.top;
                const marginBottom = margin.bottom;
                const marginLeft = margin.left;
                const marginRight = margin.right;

                const padding = styleContext.get_padding(Gtk.StateFlags.NORMAL);
                const paddingTop = padding.top;
                const paddingBottom = padding.bottom;
                const paddingLeft = padding.left;
                const paddingRight = padding.right;

                const border = styleContext.get_border(Gtk.StateFlags.NORMAL);
                const borderTop = border.top;
                const borderBottom = border.bottom;
                const borderLeft = border.left;
                const borderRight = border.right;

                const totalHeight = marginTop + marginBottom + paddingTop + paddingBottom + borderTop + borderBottom + textHeight;
                const totalWidth = marginLeft + marginRight + paddingLeft + paddingRight + borderLeft + borderRight + rect.width;

                self.set_size_request(totalWidth * count, totalHeight);
                return {
                    fontFamily,
                    fontWeight: fontWeightName,
                    fontStyle,
                    fontSize,
                    textHeight,
                    marginTop,
                    marginBottom,
                    marginLeft,
                    marginRight,
                    paddingTop,
                    paddingBottom,
                    paddingLeft,
                    paddingRight,
                    borderTop,
                    borderBottom,
                    borderLeft,
                    borderRight,
                    totalHeight,
                    totalWidth
                };
            },
            draw: (self, cr, width, height, styleContext) => {
                if (!self.attribute.initialized) {
                    self.attribute.initialized = true;
                    self.attribute.updateMask(self);
                }
                const activeId = self.attribute.workspaceGroup;
                const workspaceMask = self.attribute.workspaceMask;

                const props = self.attribute.setup(self);
                const {
                    fontFamily, fontWeight, fontStyle, fontSize,
                    textHeight,
                    marginTop, marginBottom, marginLeft, marginRight,
                    paddingTop, paddingBottom, paddingLeft, paddingRight,
                    borderTop, borderBottom, borderLeft, borderRight,
                    totalHeight, totalWidth
                } = props;

                for (let i = 0; i < count; i++) {
                    const isActive = i === activeId;
                    const isOccupied = (workspaceMask & (1 << i)) !== 0;

                    const x = i * totalWidth + marginLeft;
                    const y = marginTop;
                    const boxWidth = totalWidth - marginLeft - marginRight;
                    const boxHeight = totalHeight - marginTop - marginBottom;

                    // Draw background
                    cr.save();
                    if (isActive) {
                        styleContext.save();
                        styleContext.add_class('knoks-ws-active');
                        Gtk.render_background(styleContext, cr, x, y, boxWidth, boxHeight);
                        Gtk.render_frame(styleContext, cr, x, y, boxWidth, boxHeight);
                        styleContext.restore();
                    } else if (isOccupied) {
                        styleContext.save();
                        styleContext.add_class('knoks-ws-occupied');
                        Gtk.render_background(styleContext, cr, x, y, boxWidth, boxHeight);
                        Gtk.render_frame(styleContext, cr, x, y, boxWidth, boxHeight);
                        styleContext.restore();
                    } else {
                        Gtk.render_background(styleContext, cr, x, y, boxWidth, boxHeight);
                        Gtk.render_frame(styleContext, cr, x, y, boxWidth, boxHeight);
                    }
                    cr.restore();

                    // Draw text
                    cr.save();
                    const layout = PangoCairo.create_layout(cr);
                    const fontString = `${fontWeight} ${fontSize}px "${fontFamily}"`;
                    const wsOptions = globalThis.userOptions?.workspaces;
                    const style = wsOptions?.style || 'japanese';
                    layout.set_text(getWorkspaceLabel(i + 1, style, wsOptions?.labels), -1);
                    layout.set_font_description(Pango.FontDescription.from_string(fontString));

                    const [_, textRect] = layout.get_pixel_extents();
                    const textX = x + (boxWidth - textRect.width) / 2;
                    const textY = y + (boxHeight - textHeight) / 2;

                    cr.moveTo(textX, textY);
                    if (isActive) {
                        styleContext.save();
                        styleContext.add_class('knoks-ws-active');
                        const color = styleContext.get_color(Gtk.StateFlags.NORMAL);
                        Gdk.cairo_set_source_rgba(cr, color);
                        PangoCairo.show_layout(cr, layout);
                        styleContext.restore();
                    } else if (isOccupied) {
                        styleContext.save();
                        styleContext.add_class('knoks-ws-occupied');
                        const color = styleContext.get_color(Gtk.StateFlags.NORMAL);
                        Gdk.cairo_set_source_rgba(cr, color);
                        PangoCairo.show_layout(cr, layout);
                        styleContext.restore();
                    } else {
                        const color = styleContext.get_color(Gtk.StateFlags.NORMAL);
                        Gdk.cairo_set_source_rgba(cr, color);
                        PangoCairo.show_layout(cr, layout);
                    }
                    cr.restore();
                }
            }
        }
    });

    area.hook(Hyprland, area.attribute.updateMask);
    area.hook(Hyprland.active.workspace, area.attribute.updateMask);
    return area;
};

export default () => EventBox({
    onScrollUp: () => Hyprland.messageAsync('dispatch workspace -1').catch(print),
    onScrollDown: () => Hyprland.messageAsync('dispatch workspace +1').catch(print),
    onMiddleClickRelease: () => Hyprland.messageAsync('dispatch workspace previous').catch(print),
    onSecondaryClick: () => {
        const wsOptions = globalThis.userOptions?.workspaces;
        wsOptions.style = wsOptions.style === 'unicode' ? 'numeric' : 'unicode';
        globalThis.userOptions.set('workspaces', wsOptions);
    },
    child: Box({
        homogeneous: true,
        className: 'knoks-group-margin',
        children: [Box({
            className: 'knoks-group knoks-group-standalone knoks-group-pad',
            css: 'min-width: 2px;',
            children: [WorkspaceContents(globalThis.userOptions?.workspaces?.shown || 10)],
        })]
    }),
    setup: (self) => {
        self.add_events(Gdk.EventMask.POINTER_MOTION_MASK);
        self.on('motion-notify-event', (self, event) => {
            if (!self.attribute.clicked) return;
            const [_, cursorX, cursorY] = event.get_coords();
            const widgetWidth = self.get_allocation().width;
            const wsId = Math.ceil(cursorX * (globalThis.userOptions?.workspaces?.shown || 10) / widgetWidth);
            Utils.execAsync([`${App.configDir}/scripts/hyprland/workspace_action.sh`, 'workspace', `${wsId}`])
                .catch(print);
        })
        self.on('button-press-event', (self, event) => {
            if (event.get_button()[1] === 1) {
                self.attribute.clicked = true;
                const [_, cursorX, cursorY] = event.get_coords();
                const widgetWidth = self.get_allocation().width;
                const wsId = Math.ceil(cursorX * (globalThis.userOptions?.workspaces?.shown || 10) / widgetWidth);
                Utils.execAsync([`${App.configDir}/scripts/hyprland/workspace_action.sh`, 'workspace', `${wsId}`])
                    .catch(print);
            }
            else if (event.get_button()[1] === 8) {
                Hyprland.messageAsync(`dispatch togglespecialworkspace`).catch(print);
            }
        })
        self.on('button-release-event', (self) => self.attribute.clicked = false);
    }
});
