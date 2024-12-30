import Widget from 'resource:///com/github/Aylur/ags/widget.js';

export const searchItem = ({ materialIconName, name, content, onActivate, useNormalIcon = false }) => {
    const actionText = Widget.Revealer({
        revealChild: false,
        transition: "crossfade",
        transitionDuration: userOptions.asyncGet().animations.durationLarge || 300,
        child: Widget.Label({
            className: 'overview-search-results-txt txt txt-small txt-action',
            label: 'Open',
        })
    });

    const actionTextRevealer = Widget.Revealer({
        revealChild: false,
        transition: "slide_left",
        transitionDuration: userOptions.asyncGet().animations.durationSmall || 150,
        child: actionText,
    });

    const iconWidget = useNormalIcon ? 
        Widget.Icon({ 
            icon: materialIconName,
            size: 32,
        }) :
        Widget.Label({
            className: 'icon-material overview-search-results-icon',
            label: materialIconName,
        });

    return Widget.Button({
        className: 'overview-search-result-btn',
        onClicked: onActivate,
        child: Widget.Box({
            children: [
                Widget.Box({
                    vertical: false,
                    children: [
                        useNormalIcon ? 
                            Widget.Box({
                                className: 'overview-search-results-icon',
                                homogeneous: true,
                                child: iconWidget,
                            }) : 
                            iconWidget,
                        Widget.Box({
                            vertical: true,
                            children: [
                                Widget.Label({
                                    className: 'overview-search-results-txt txt txt-norm',
                                    label: name,
                                    xalign: 0,
                                    truncate: 'end',
                                }),
                                Widget.Label({
                                    className: 'overview-search-results-txt txt txt-small txt-desc',
                                    label: content,
                                    wrap: true,
                                    xalign: 0,
                                    justification: 'left',
                                    truncate: 'end',
                                }),
                            ],
                        }),
                        Widget.Box({ hexpand: true }),
                        actionTextRevealer,
                    ]
                })
            ]
        }),
        setup: (self) => self
            .on('focus-in-event', () => {
                actionText.revealChild = true;
                actionTextRevealer.revealChild = true;
            })
            .on('focus-out-event', () => {
                actionText.revealChild = false;
                actionTextRevealer.revealChild = false;
            }),
    });
}
