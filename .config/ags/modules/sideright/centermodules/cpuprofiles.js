import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Button, Entry, Icon, Label, Revealer, Scrollable, Slider, Stack, Overlay } = Widget;
const { execAsync } = Utils;
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';
import AutoCpuFreq from '../../../services/autocpufreq.js';

const PROFILES_META = {
    'power-saver': {
        'label': "Power Saver",
        'icon': "access_time",
        'describe': "Reduced performance and power usage",
    },
    'balanced': {
        'label': "Balanced",
        'icon': "balance",
        'describe': "Standard performance and power usage",
    },
    'performance': {
        'label': "Performance",
        'icon': "bolt",
        'describe': "High performance and power usage"
    },
};

/**
 * The item in the profile list
 * @param {string} profile 
 */
const PowerProfile = (profile) => {
    const meta = PROFILES_META[profile];

    const profileName = Box({
        vertical: true,
        children: [
            Label({
                hpack: 'start',
                label: meta.label
            }),
            Label({
                hpack: 'start',
                className: 'txt-smaller txt-subtext',
                label: meta.describe
            })
        ],
    });

    return Button({
        onClicked: () => {
            AutoCpuFreq.active_profile = profile;
        },
        child: Box({
            className: 'sidebar-wifinetworks-network spacing-h-10',
            setup: box => box.hook(AutoCpuFreq, () => {
                const isSelected = AutoCpuFreq.active_profile === profile;
                box.children = [
                    MaterialIcon(meta.icon, 'hugerass'),
                    profileName,
                    Box({ hexpand: true }),
                    isSelected ? MaterialIcon('check', 'large') : null
                ];
            }, 'active-profile-changed'),
        }),
    });
}

export default (props) => {
    const profile_list = Box({
        vertical: true,
        className: 'spacing-v-10',
        children: [
            Overlay({
                passThrough: true,
                child: Scrollable({
                    vexpand: true,
                    child: Box({
                        vertical: true,
                        className: 'spacing-v-5 margin-bottom-15',
                        children: AutoCpuFreq.profiles.map(profile => PowerProfile(profile)),
                    }),
                }),
                overlays: [
                    Box({
                        className: 'sidebar-centermodules-scrollgradient-bottom'
                    }),
                ],
            }),
        ],
    });

    return Box({
        ...props,
        className: 'spacing-v-10',
        vertical: true,
        children: [
            profile_list
        ],
    });
};
