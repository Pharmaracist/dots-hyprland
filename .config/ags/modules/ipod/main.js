import Widget from "resource:///com/github/Aylur/ags/widget.js";
import IpodWidget from "./ipodwidget.js";
import App from 'resource:///com/github/Aylur/ags/app.js';

const toggleWindow = () => {
    const win = App.getWindow('ipod');
    if (!win) return;
    win.visible = !win.visible;
};

// Export the toggle function so it can be used from other modules
export { toggleWindow };

export default () => {
    const win = Widget.Window({
        name: 'ipod',
        layer: 'overlay',
        anchor: ['top', 'bottom', 'right', 'left'],
        exclusive: false,
        visible: false,
        child: Widget.Overlay({
            child: Widget.EventBox({
                onPrimaryClick: () => App.closeWindow('ipod'),
                onSecondaryClick: () => App.closeWindow('ipod'),
                onMiddleClick: () => App.closeWindow('ipod'),
                child: Widget.Box({
                    css: 'min-height: 1000px;',
                }),
            }),
            overlays: [
                Widget.Box({
                    css: 'margin: 0; padding: 0;',
                    vpack: 'end',
                    visible: true,
                    child: IpodWidget(),
                }),
            ],
        }),
    });

    // Ensure window is hidden on startup
    App.connect('window-toggled', (_, name, visible) => {
        if (name === 'ipod' && visible) {
            const overlay = win.get_children()[0];
            const widgetBox = overlay.get_children()[1];
            if (!widgetBox.visible) {
                App.closeWindow('ipod');
            }
        }
    });

    return win;
};
