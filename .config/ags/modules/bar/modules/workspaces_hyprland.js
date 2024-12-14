import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import { userOptions } from '../../lib/option.js';

const dummyWs = Widget.Box({ className: 'workspace' });
const dummyActiveWs = Widget.Box({ className: 'workspace active' });
const dummyOccupiedWs = Widget.Box({ className: 'workspace occupied' });

const getFontWeightName = (weight) => {
    switch (weight) {
        case Pango.Weight.ULTRA_LIGHT:
            return "Ultra Light";
        case Pango.Weight.LIGHT:
            return "Light";
        case Pango.Weight.NORMAL:
            return "Regular";
        case Pango.Weight.BOLD:
            return "Bold";
        case Pango.Weight.ULTRA_BOLD:
            return "Ultra Bold";
        default:
            return "Regular";
    }
}

const WorkspaceContents = (count) => Widget.DrawingArea({
    attribute: {
        clicked: false,
        initialized: false,
        workspaceMask: 0,
        workspaceGroup: 0,
        updateMask: (self) => {
            const offset = Math.floor((Hyprland.active.workspace.id - 1) / count) * count;
            const workspaces = Hyprland.workspaces;
            let workspaceMask = 0;
            for (let i = 0; i < workspaces.length; i++) {
                const ws = workspaces[i];
                if (ws.id <= offset || ws.id > offset + count) continue;
                if (workspaces[i].windows > 0)
                    workspaceMask |= (1 << (ws.id - offset - 1));
            }
            self.attribute.workspaceMask = workspaceMask;
            self.attribute.workspaceGroup = Math.floor((Hyprland.active.workspace.id - 1) / count);
            self.queue_draw();
        },
        toggleMask: (self, occupied, name) => {
            if (occupied)
                self.attribute.workspaceMask |= (1 << (parseInt(name) - 1));
            else
                self.attribute.workspaceMask &= ~(1 << (parseInt(name) - 1));
            self.queue_draw();
        },
    },
    setup: (self) => {
        self.set_size_request(1, -1);
        self.on('draw', (self, cr) => {
            const width = self.get_allocated_width();
            const height = self.get_allocated_height();

            // Set up text properties
            const layout = PangoCairo.create_layout(cr);
            const desc = Pango.FontDescription.from_string(`${dummyWs.get_style_context().get_property('font-family', Gtk.StateFlags.NORMAL)[0]} ${getFontWeightName(dummyWs.get_style_context().get_property('font-weight', Gtk.StateFlags.NORMAL))} ${dummyWs.get_style_context().get_property('font-size', Gtk.StateFlags.NORMAL)}`);
            layout.set_font_description(desc);

            // Get colors from CSS
            const wsfg = dummyWs.get_style_context().get_property('color', Gtk.StateFlags.NORMAL);
            const occupiedfg = dummyOccupiedWs.get_style_context().get_property('color', Gtk.StateFlags.NORMAL);
            const occupiedbg = dummyOccupiedWs.get_style_context().get_property('background-color', Gtk.StateFlags.NORMAL);
            const activefg = dummyActiveWs.get_style_context().get_property('color', Gtk.StateFlags.NORMAL);
            const activebg = dummyActiveWs.get_style_context().get_property('background-color', Gtk.StateFlags.NORMAL);

            // Calculate dimensions
            const workspaceRadius = height * 0.3;
            const workspaceDiameter = workspaceRadius * 3;
            const activeWs = Hyprland.active.workspace.id - self.attribute.workspaceGroup * count;

            // Draw workspaces
            for (let i = 0; i < count; i++) {
                const wsId = i + 1;
                const isActive = wsId === activeWs;
                const isOccupied = (self.attribute.workspaceMask & (1 << i)) !== 0;

                // Draw background
                if (isActive || isOccupied) {
                    const wsCenterX = -(workspaceRadius) + (workspaceDiameter * (i + 1));
                    const wsCenterY = height / 2;
                    const cornerRadius = workspaceRadius * 0.4;

                    // Set color
                    if (isActive) {
                        cr.setSourceRGBA(activebg.red, activebg.green, activebg.blue, activebg.alpha);
                    } else {
                        cr.setSourceRGBA(occupiedbg.red, occupiedbg.green, occupiedbg.blue, occupiedbg.alpha);
                    }

                    // Check adjacent workspaces
                    const leftConnected = i > 0 && (self.attribute.workspaceMask & (1 << (i - 1)));
                    const rightConnected = i < count - 1 && (self.attribute.workspaceMask & (1 << (i + 1)));

                    // Draw shape
                    cr.newPath();
                    if (!leftConnected && !rightConnected) {
                        // Rounded rectangle
                        cr.moveTo(wsCenterX - workspaceRadius + cornerRadius, wsCenterY - workspaceRadius);
                        cr.lineTo(wsCenterX + workspaceRadius - cornerRadius, wsCenterY - workspaceRadius);
                        cr.arc(wsCenterX + workspaceRadius - cornerRadius, wsCenterY - workspaceRadius + cornerRadius, cornerRadius, -Math.PI/2, 0);
                        cr.lineTo(wsCenterX + workspaceRadius, wsCenterY + workspaceRadius - cornerRadius);
                        cr.arc(wsCenterX + workspaceRadius - cornerRadius, wsCenterY + workspaceRadius - cornerRadius, cornerRadius, 0, Math.PI/2);
                        cr.lineTo(wsCenterX - workspaceRadius + cornerRadius, wsCenterY + workspaceRadius);
                        cr.arc(wsCenterX - workspaceRadius + cornerRadius, wsCenterY + workspaceRadius - cornerRadius, cornerRadius, Math.PI/2, Math.PI);
                        cr.lineTo(wsCenterX - workspaceRadius, wsCenterY - workspaceRadius + cornerRadius);
                        cr.arc(wsCenterX - workspaceRadius + cornerRadius, wsCenterY - workspaceRadius + cornerRadius, cornerRadius, Math.PI, 3*Math.PI/2);
                    } else if (!leftConnected && rightConnected) {
                        // Left rounded
                        cr.moveTo(wsCenterX - workspaceRadius + cornerRadius, wsCenterY - workspaceRadius);
                        cr.lineTo(wsCenterX + workspaceRadius, wsCenterY - workspaceRadius);
                        cr.lineTo(wsCenterX + workspaceRadius, wsCenterY + workspaceRadius);
                        cr.lineTo(wsCenterX - workspaceRadius + cornerRadius, wsCenterY + workspaceRadius);
                        cr.arc(wsCenterX - workspaceRadius + cornerRadius, wsCenterY + workspaceRadius - cornerRadius, cornerRadius, Math.PI/2, Math.PI);
                        cr.lineTo(wsCenterX - workspaceRadius, wsCenterY - workspaceRadius + cornerRadius);
                        cr.arc(wsCenterX - workspaceRadius + cornerRadius, wsCenterY - workspaceRadius + cornerRadius, cornerRadius, Math.PI, 3*Math.PI/2);
                    } else if (leftConnected && !rightConnected) {
                        // Right rounded
                        cr.moveTo(wsCenterX - workspaceRadius, wsCenterY - workspaceRadius);
                        cr.lineTo(wsCenterX + workspaceRadius - cornerRadius, wsCenterY - workspaceRadius);
                        cr.arc(wsCenterX + workspaceRadius - cornerRadius, wsCenterY - workspaceRadius + cornerRadius, cornerRadius, -Math.PI/2, 0);
                        cr.lineTo(wsCenterX + workspaceRadius, wsCenterY + workspaceRadius - cornerRadius);
                        cr.arc(wsCenterX + workspaceRadius - cornerRadius, wsCenterY + workspaceRadius - cornerRadius, cornerRadius, 0, Math.PI/2);
                        cr.lineTo(wsCenterX - workspaceRadius, wsCenterY + workspaceRadius);
                    } else {
                        // Rectangle
                        cr.rectangle(wsCenterX - workspaceRadius, wsCenterY - workspaceRadius, workspaceRadius * 2, workspaceRadius * 2);
                    }
                    cr.closePath();
                    cr.fill();
                }

                // Draw label
                if (isActive) {
                    cr.setSourceRGBA(activefg.red, activefg.green, activefg.blue, activefg.alpha);
                } else if (isOccupied) {
                    cr.setSourceRGBA(occupiedfg.red, occupiedfg.green, occupiedfg.blue, occupiedfg.alpha);
                } else {
                    cr.setSourceRGBA(wsfg.red, wsfg.green, wsfg.blue, wsfg.alpha);
                }

                layout.set_text(`${wsId}`, -1);
                const [layoutWidth, layoutHeight] = layout.get_pixel_size();
                const x = -(workspaceRadius) + (workspaceDiameter * (i + 1)) - (layoutWidth / 2);
                const y = (height - layoutHeight) / 2;
                cr.moveTo(x, y);
                PangoCairo.show_layout(cr, layout);
            }
        });

        // Set up event handlers
        self.add_events(Gdk.EventMask.POINTER_MOTION_MASK);
        self.on('motion-notify-event', (self, event) => {
            if (!self.attribute.clicked) return;
            const [_, cursorX] = event.get_coords();
            const widgetWidth = self.get_allocation().width;
            const wsId = Math.ceil(cursorX * count / widgetWidth);
            Utils.execAsync([`${App.configDir}/scripts/hyprland/workspace_action.sh`, 'workspace', `${wsId}`])
                .catch(print);
        });

        self.on('button-press-event', (self, event) => {
            if (event.get_button()[1] === 1) {
                self.attribute.clicked = true;
                const [_, cursorX] = event.get_coords();
                const widgetWidth = self.get_allocation().width;
                const wsId = Math.ceil(cursorX * count / widgetWidth);
                Utils.execAsync([`${App.configDir}/scripts/hyprland/workspace_action.sh`, 'workspace', `${wsId}`])
                    .catch(print);
            }
            else if (event.get_button()[1] === 8) {
                Hyprland.messageAsync(`dispatch togglespecialworkspace`).catch(print);
            }
        });

        self.on('button-release-event', (self) => self.attribute.clicked = false);

        // Set up workspace monitoring
        self.hook(Hyprland.active.workspace, () => self.attribute.updateMask(self));
        self.hook(Hyprland, (_, name, data) => {
            if (name === 'createworkspace' || name === 'destroyworkspace')
                self.attribute.updateMask(self);
            else if (name === 'workspace' || name === 'openwindow' || name === 'closewindow')
                self.attribute.toggleMask(self, data.windows > 0, data.workspace.id);
        });
    }
});

export default () => EventBox({
    onScrollUp: () => Hyprland.messageAsync(`dispatch workspace -1`).catch(print),
    onScrollDown: () => Hyprland.messageAsync(`dispatch workspace +1`).catch(print),
    onMiddleClick: () => toggleWindowOnAllMonitors('osk'),
    onSecondaryClick: () => App.toggleWindow('overview'),
    attribute: {
        clicked: false,
        ws_group: 0,
    },
    child: Box({
        homogeneous: true,
        children: [
            WorkspaceContents(userOptions.asyncGet().workspaces.shown),
        ]
    })
});
