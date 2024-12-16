import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import SystemTray from 'resource:///com/github/Aylur/ags/service/systemtray.js';
const { Box, Icon, Button, Revealer } = Widget;
const { Gravity } = imports.gi.Gdk;

const SysTrayItem = (item) => item.id !== null ? Button({
    className: 'bar-systray-item',
    child: Icon({ 
        hpack: 'center',
        size: 16,
    }).bind('icon', item, 'icon'),
    setup: (self) => self
        .hook(item, (self) => self.tooltipMarkup = item['tooltip-markup'])
    ,
    onPrimaryClick: (_, event) => item.activate(event),
    onSecondaryClick: (btn, event) => item.menu.popup_at_widget(btn, Gravity.SOUTH, Gravity.NORTH, null),
}) : null;

export const Systray = (props = {}) => {
    const trayContent = Box({
        className: 'spacing-h-15',
        css:"min-width:1rem;",
        setup: (self) => self
            .hook(SystemTray, (self) => {
                const items = SystemTray.items.map(SysTrayItem).filter(i => i !== null);
                self.children = items;
                self.visible = items.length > 0;
            })
    });

    return Box({
        ...props,
        className: 'systray',
        setup: (self) => self
            .hook(SystemTray, (self) => {
                self.visible = SystemTray.items.length > 0;
            }),
        children: [
            Revealer({
                revealChild: true,
                transition: 'slide_left',
                transitionDuration: userOptions.asyncGet().animations.durationLarge,
                child: trayContent,
                setup: (self) => self
                    .hook(SystemTray, (self) => {
                        self.revealChild = SystemTray.items.length > 0;
                    })
            })
        ]
    });
};