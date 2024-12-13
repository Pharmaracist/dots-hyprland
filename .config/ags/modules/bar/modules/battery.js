// External dependencies
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
const { Box, Label, Overlay, Revealer, EventBox } = Widget;
const { execAsync, exec } = Utils;
const { GLib } = imports.gi;

// Common widgets
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";

// Configuration
const { userOptions } = globalThis;

// Constants
const POWER_DRAW = {
    CACHE_DURATION: 5000,
    PATHS: {
        CURRENT: "/sys/class/power_supply/BAT0/current_now",
        VOLTAGE: "/sys/class/power_supply/BAT0/voltage_now"
    },
    CONVERSION: {
        TO_AMPS: 1000000,
        TO_VOLTS: 1000000
    }
};

// Cache state
const powerDrawCache = { 
    value: "N/A", 
    timestamp: 0 
};

// Utility functions
const fetchPowerDraw = async () => {
    const now = Date.now();
    if (powerDrawCache.timestamp + POWER_DRAW.CACHE_DURATION > now) {
        return powerDrawCache.value;
    }

    try {
        const current = parseInt(await Utils.execAsync(`cat ${POWER_DRAW.PATHS.CURRENT}`), 10);
        const voltage = parseInt(await Utils.execAsync(`cat ${POWER_DRAW.PATHS.VOLTAGE}`), 10);

        const currentInAmps = current / POWER_DRAW.CONVERSION.TO_AMPS;
        const voltageInVolts = voltage / POWER_DRAW.CONVERSION.TO_VOLTS;
        const powerInWatts = (currentInAmps * voltageInVolts).toFixed(2);

        powerDrawCache.value = `${powerInWatts} W`;
        powerDrawCache.timestamp = now;
        return powerDrawCache.value;
    } catch (error) {
        console.error('Error fetching power draw:', error);
        return 'N/A';
    }
};

const BarBatteryProgress = () => {
    const _updateProgress = (circprog) => {
        const percent = Battery.percent;
        const css = `font-size: ${percent}px;`;
        circprog.css = css;
        circprog.toggleClassName("bar-bat-circprog-low", Battery.percent <= (userOptions.battery?.low || 20));
        circprog.toggleClassName("bar-bat-circprog-full", Battery.charged);
        circprog.toggleClassName("bar-bat-charging", Battery.charging);
    };
    return AnimatedCircProg({
        className: "bar-bat-circprog",
        vpack: "center",
        hpack: "center",
        extraSetup: (self) => self.hook(Battery, _updateProgress),
    });
};

const BatteryContent = () => {
    let timeoutId = 0;

    const percentageLabel = Label({
        className: "sec-txt txt-percent txt-hugerass",
        setup: (self) => self.hook(Battery, (label) => {
            label.label = `${Battery.percent.toFixed(0)}%   `;
        }),
    });

    const timeToEmptyFullLabel = Label({ hpack: "start", className: "sec-txt txt-smallie" });
    const powerDrawLabel = Label({ hpack: "start", className: "sec-txt txt-smallie" });
    
    const detailsBox = Box({
        hpack: "start", 
        vertical: true, 
        children: [timeToEmptyFullLabel, powerDrawLabel],
    });

    const percentageBox = Box({
        className: "margin-rl-10",
        children: [
            percentageLabel,
            detailsBox,
        ]
    });

    const detailsRevealer = Revealer({
        transitionDuration: userOptions.animations?.durationLarge || 150,
        transition: "slide_right",
        revealChild: false,
        child: percentageBox,
    });

    const batteryIcon = Overlay({
        child: Box({
            vpack: "center",
            className: "bar-bat",
            homogeneous: true,
            children: [],
            setup: (self) =>
                self.hook(Battery, (box) => {
                    box.toggleClassName("bar-bat-low", Battery.percent <= (userOptions.battery?.low || 20));
                    box.toggleClassName("bar-bat-full", Battery.charged);
                    box.toggleClassName("bar-bat-charging", Battery.charging);
                }),
        }),
        overlays: [BarBatteryProgress()],
    });

    const updateBatteryDetails = async () => {
        const powerDraw = await fetchPowerDraw();
        powerDrawLabel.label = `Power: ${powerDraw}`;

        try {
            const result = await Utils.execAsync("upower -i /org/freedesktop/UPower/devices/battery_BAT0");
            const lines = result.split('\n');
            let timeToEmptyFull = "N/A";

            for (const line of lines) {
                if (line.includes("time to")) {
                    timeToEmptyFull = line.split(":")[1].trim();
                    break;
                }
            }
            timeToEmptyFullLabel.label = timeToEmptyFull;
        } catch (error) {
            console.error("Error getting battery info with upower:", error);
            timeToEmptyFullLabel.label = "Error";
        }
    };

    // Initial update
    updateBatteryDetails();

    // Periodic updates
    timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 5000, () => {
        updateBatteryDetails();
        return GLib.SOURCE_CONTINUE;
    });

    return Box({
        className: "bar-battery-module spacing-h-10",
        children: [
            Box({
                className: "bar-battery-content",
                children: [batteryIcon]
            }),
            detailsRevealer
        ],
        setup: (self) => {
            self.revealer = detailsRevealer;
        },
    });
};

export default () => Widget.EventBox({
    onPrimaryClick: (self) => {
        self.child.revealer.revealChild = !self.child.revealer.revealChild;
    },
    onSecondaryClick: () => {
        Utils.execAsync(['xfce4-power-manager-settings']).catch(print);
    },
    onMiddleClick: () => {},
    child: BatteryContent(),
});
