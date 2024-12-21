import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import QuranService from '../services/quran.js';

export const QuranWidget = () => Widget.Box({
    className: 'quran-widget',
    vertical: true,
    children: [
        Widget.Label({
            className: 'quran-surah-name',
            connections: [[QuranService, label => {
                label.label = QuranService.surahName;
            }]],
        }),
        Widget.Label({
            className: 'quran-translation',
            wrap: true,
            connections: [[QuranService, label => {
                label.label = QuranService.translation;
            }]],
        }),
        Widget.Box({
            className: 'quran-controls',
            children: [
                Widget.Button({
                    child: Widget.Label('Previous'),
                    onClicked: () => QuranService.previousAyah(),
                }),
                Widget.Button({
                    child: Widget.Label('Next'),
                    onClicked: () => QuranService.nextAyah(),
                }),
            ],
        }),
    ],
});
