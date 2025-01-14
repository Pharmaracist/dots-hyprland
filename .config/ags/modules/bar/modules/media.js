import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";

const MediaIndicator = () => Widget.Box({
    className: 'bar-media-indicator',
    setup: self => {
        const icon = Widget.Icon({
            icon: 'audio-x-generic-symbolic',
            size: 16,
        });

        const label = Widget.Label({
            className: 'bar-media-title',
        });

        self.children = [icon, label];

        const updateWidget = () => {
            const player = Mpris.getPlayer();
            const trackInfo = Mpris.trackInfo;
            
            if (!player || !trackInfo) {
                self.visible = false;
                return;
            }

            self.visible = true;
            const { title, artist } = trackInfo;
            label.label = artist ? `${title} - ${artist}` : title;
        };

        // Connect to property changes
        const handlers = [
            Mpris.connect('notify::player', updateWidget),
            Mpris.connect('notify::track', updateWidget),
        ];

        self.connect('destroy', () => {
            handlers.forEach(handler => {
                try {
                    Mpris.disconnect(handler);
                } catch (error) {
                    console.error('Error disconnecting handler:', error);
                }
            });
        });

        updateWidget();
    },
});

export default () => Widget.Button({
    className: "media-button",
    child: MediaIndicator(),
});
