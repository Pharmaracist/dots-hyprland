import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Button, Label, Scrollable } = Widget;
import { MaterialIcon } from '../.commonwidgets/materialicon.js';
import { setupCursorHover } from '../.widgetutils/cursorhover.js';
import PrayerTimesService from '../../services/prayertimes.js';

const TopSection = (nextPrayer, hijriDate) => {
    if (!nextPrayer) return null;
    
    return Box({
        className: 'sidebar-prayertime-top',
        vertical: true,
        children: [
            Label({
                xalign: 0,
                className: 'txt txt-smallie',
                label: hijriDate || '',
            }),
            Box({
                className: 'sidebar-prayertime-next',
                children: [
                    Box({
                        vertical: true,
                        children: [
                            Label({
                                xalign: 0,
                                className: 'txt-small',
                                label: getString('Next Prayer:'),
                            }),
                            Box({
                                className: 'spacing-h-5',
                                children: [
                                    Label({
                                        xalign: 0,
                                        className: 'txt-larger sidebar-prayertime-name',
                                        label: getString(nextPrayer.name),
                                    }),
                                    Label({
                                        xalign: 1,
                                        hexpand: true,
                                        className: 'txt-larger sidebar-prayertime-time',
                                        label: nextPrayer.time || '',
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
};

const PrayerTimeItem = (name, time) => {
    return Box({
        className: 'sidebar-prayertime-item txt-small',
        children: [
            Box({
                vertical: true,
                hexpand: true,
                children: [
                    Label({
                        xalign: 0,
                        className: 'sidebar-prayertime-name',
                        label: getString(name),
                    }),
                    Label({
                        xalign: 0,
                        className: 'sidebar-prayertime-time',
                        label: time || '',
                    }),
                ],
            }),
        ],
    });
};

const updateContent = (widget, times, nextPrayer, hijriDate) => {
    // Clear existing children
    widget.children = [
        TopSection(nextPrayer, hijriDate),
        Box({
            vertical: true,
            className: 'spacing-v-5',
            children: times.map(prayer => {
                if (!nextPrayer || prayer.name !== nextPrayer.name) {
                    return PrayerTimeItem(prayer.name, prayer.time);
                }
                return null;
            }).filter(item => item !== null)
        })
    ];
};

export const PrayerTimesWidget = () => {
    const prayersList = Box({
        vertical: true,
        className: 'spacing-v-5',
    });

    const header = Box({
        className: 'spacing-h-5',
        children: [
            Label({
                hexpand: true,
                xalign: 0,
                css: "margin-top:0.7rem",
                className: 'txt-large txt-bold',
                label: getString('Prayer Times'),
            }),
            Button({
                className: 'txt-large icon-material',
                label: 'refresh',
                hpack: "end",
                setup: setupCursorHover,
                onClicked: () => {
                    PrayerTimesService.refresh();
                },
            }),
        ],
    });

    const scrollArea = Scrollable({
        vexpand: true,
        child: prayersList,
        setup: (scrollable) => {
            const vScrollbar = scrollable.get_vscrollbar();
            vScrollbar.get_style_context().add_class('sidebar-scrollbar');
        },
    });

    const update = () => {
        const prayers = [
            { name: 'Fajr', time: PrayerTimesService.fajr },
            { name: 'Dhuhr', time: PrayerTimesService.dhuhr },
            { name: 'Asr', time: PrayerTimesService.asr },
            { name: 'Maghrib', time: PrayerTimesService.maghrib },
            { name: 'Isha', time: PrayerTimesService.isha }
        ];

        const nextPrayer = {
            name: PrayerTimesService.nextPrayerName,
            time: PrayerTimesService.nextPrayerTime
        };
        
        // Create items array
        const items = [];
        
        // Add top section with Hijri date and next prayer
        items.push(TopSection(nextPrayer, PrayerTimesService.hijriDate));
        
        // Add remaining prayers
        prayers.forEach(prayer => {
            if (!nextPrayer || prayer.name !== nextPrayer.name) {
                items.push(PrayerTimeItem(
                    prayer.name,
                    prayer.time
                ));
            }
        });
        
        prayersList.children = items;
    };

    return Box({
        vertical: true,
        className: 'spacing-v-10',
        setup: (box) => {
            // Add cleanup handler
            box.connect('destroy', () => {
                box.get_children().forEach(child => {
                    if (child.destroy) child.destroy();
                });
            });

            const updateHandler = PrayerTimesService.connect('updated', update);
            box.connect('destroy', () => {
                PrayerTimesService.disconnect(updateHandler);
            });
            
            box.children = [header, scrollArea];
            
            // Initial update and trigger refresh
            update();
            PrayerTimesService.refresh();
        },
    });
};
