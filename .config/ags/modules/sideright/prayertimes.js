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

export const PrayerTimesWidget = () => {
    const prayersList = Box({
        vertical: true,
        className: 'spacing-v-5',
    });

    const update = () => {
        const prayers = [
            { name: 'Fajr', time: PrayerTimesService.fajr },
            { name: 'Dhuhr', time: PrayerTimesService.dhuhr },
            { name: 'Asr', time: PrayerTimesService.asr },
            { name: 'Maghrib', time: PrayerTimesService.maghrib },
            { name: 'Isha', time: PrayerTimesService.isha }
        ];

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        let nextPrayer = null;

        for (const prayer of prayers) {
            if (!prayer.time) continue;
            const [hours, minutes] = prayer.time.split(':').map(Number);
            const prayerTime = hours * 60 + minutes;
            if (prayerTime > currentTime) {
                nextPrayer = prayer;
                break;
            }
        }

        if (!nextPrayer) nextPrayer = prayers[0];
        
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

    const header = Box({
        className: 'spacing-h-5',
        children: [
            Label({
                hexpand: true,
                xalign: 0,
                css:"margin-top:0.7rem",
                className: 'txt-large txt-bold',
                label: getString('Prayer Times'),
            }),
            Button({
                className: 'txt-large icon-material',
                label: 'refresh',
                hpack:"end",
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

    return Box({
        vertical: true,
        className: 'spacing-v-10',
        setup: (box) => {
            const hook = box.hook(PrayerTimesService, update, 'updated');
            box.connect('destroy', () => box.unhook(hook));
            
            box.children = [ scrollArea];
            update();
        },
    });
};
