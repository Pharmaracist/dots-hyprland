import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import Notifications from 'resource:///com/github/Aylur/ags/service/notifications.js';

const NotificationIndicator = () => Widget.Box({
    class_name: 'notification-indicator',
    children: [
        Widget.Icon({
            icon: 'notification-symbolic',
            size: 16,
        }),
        Widget.Label({
            connections: [[Notifications, label => {
                const count = Notifications.notifications.length || 0;
                label.label = count > 0 ? ` ${count}` : '';
            }]],
        }),
    ],
    connections: [[Notifications, box => {
        box.visible = Notifications.notifications.length > 0;
    }]],
});

const NotificationPopup = () => Widget.Window({
    name: 'notification-popup',
    anchor: ['top', 'right'],
    child: Widget.Box({
        class_name: 'notification-popup-box',
        vertical: true,
        children: [
            Widget.Box({
                class_name: 'notification-header',
                children: [
                    Widget.Label({
                        class_name: 'notification-header-label',
                        label: 'Notifications',
                    }),
                    Widget.Button({
                        class_name: 'notification-clear-button',
                        child: Widget.Icon({
                            icon: 'edit-clear-symbolic',
                        }),
                        on_clicked: () => Notifications.clear(),
                    }),
                ],
            }),
            Widget.Box({
                class_name: 'notification-list',
                vertical: true,
                connections: [[Notifications, box => {
                    box.children = Notifications.notifications.map(n => Widget.Box({
                        class_name: 'notification-item',
                        children: [
                            Widget.Icon({
                                icon: n.app_icon || 'dialog-information-symbolic',
                                size: 32,
                            }),
                            Widget.Box({
                                vertical: true,
                                children: [
                                    Widget.Label({
                                        class_name: 'notification-title',
                                        label: n.summary,
                                        xalign: 0,
                                    }),
                                    Widget.Label({
                                        class_name: 'notification-body',
                                        label: n.body,
                                        wrap: true,
                                        xalign: 0,
                                    }),
                                ],
                            }),
                        ],
                    }));
                }]],
            }),
        ],
    }),
});

export default () => Widget.Button({
    class_name: 'notification-center',
    child: NotificationIndicator(),
    on_clicked: () => {
        const popup = NotificationPopup();
        popup.show_all();
    },
});
