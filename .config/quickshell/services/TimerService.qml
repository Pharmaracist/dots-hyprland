pragma Singleton
pragma ComponentBehavior: Bound
import Quickshell
import Quickshell.Io
import Quickshell.Hyprland
import "root:/modules/common"
import QtQuick

Singleton {
    id: root
    property var filePath: `${Directories.state}/user/timers.json`
    property var timers: []
    property int nextTimerId: 1

    signal timerFinished(int timerId, string name)

    readonly property var presets: ConfigOptions?.sidebar.timer.presets

    // Sounds via external commands (if supported)
    function playSound(name) {
        let path = "";
        if (name === "start") path = "/usr/share/sounds/ocean/stereo/battery-full.oga";
        if (name === "finish") path = "/usr/share/sounds/ocean/stereo/alarm-clock-elapsed.oga";
        if (path !== "") {
            Hyprland.dispatch(`exec paplay '${path}'`);
        }
    }

    function showNotification(title, message) {
        Hyprland.dispatch(`exec notify-send '${title},${message}'`)    
    }

    function timersToJson() {
        const saveData = {
            timers: timers.map(timer => ({
                id: timer.id,
                name: timer.name,
                originalDuration: timer.originalDuration,
                remainingTime: timer.remainingTime,
                isRunning: false,
                isPaused: timer.remainingTime < timer.originalDuration && timer.remainingTime > 0,
                preset: timer.preset,
                color: timer.color,
                icon: timer.icon
            })),
            nextTimerId: nextTimerId
        };
        return JSON.stringify(saveData, null, 2);
    }

    function jsonToTimers(jsonText) {
        try {
            const data = JSON.parse(jsonText);
            nextTimerId = data.nextTimerId || 1;
            return data.timers || [];
        } catch (e) {
            console.log("[Timer] Error parsing JSON:", e);
            return [];
        }
    }

    function saveTimers() {
        timerFileView.setText(timersToJson());
    }

    function addTimer(name, duration, preset) {
        const timer = {
            id: nextTimerId++,
            name: name,
            originalDuration: duration,
            remainingTime: duration,
            isRunning: false,
            isPaused: false,
            startTime: 0,
            pausedTime: 0,
            preset: preset || null,
            color: preset ? preset.color : "#3498db",
            icon: preset ? preset.icon : "timer",
            qtTimer: null
        };

        timers.push(timer);
        root.timers = timers.slice(0);
        saveTimers();
        return timer.id;
    }

    function removeTimer(timerId) {
        const index = timers.findIndex(t => t.id === timerId);
        if (index !== -1) {
            const timer = timers[index];
            if (timer.qtTimer) timer.qtTimer.destroy();
            timers.splice(index, 1);
            root.timers = timers.slice(0);
            saveTimers();
        }
    }

    function startTimer(timerId) {
        const timer = timers.find(t => t.id === timerId);
        if (!timer || timer.remainingTime <= 0) return;

        if (!timer.qtTimer) {
            timer.qtTimer = timerComponent.createObject(root, {
                "timerId": timerId,
                "interval": 1000,
                "repeat": true
            });
        }

        timer.isRunning = true;
        timer.isPaused = false;
        timer.startTime = Date.now() - (timer.originalDuration - timer.remainingTime) * 1000;
        timer.qtTimer.start();
        playSound("start");
        root.timers = timers.slice(0);
    }

    function pauseTimer(timerId) {
        const timer = timers.find(t => t.id === timerId);
        if (!timer || !timer.qtTimer) return;

        timer.isRunning = false;
        timer.isPaused = true;
        timer.qtTimer.stop();
        root.timers = timers.slice(0);
        saveTimers();
    }

    function resetTimer(timerId) {
        const timer = timers.find(t => t.id === timerId);
        if (!timer) return;

        if (timer.qtTimer) timer.qtTimer.stop();

        timer.isRunning = false;
        timer.isPaused = false;
        timer.remainingTime = timer.originalDuration;
        timer.startTime = 0;
        timer.pausedTime = 0;
        root.timers = timers.slice(0);
        saveTimers();
    }

    function updateTimer(timerId, newDuration) {
        const timer = timers.find(t => t.id === timerId);
        if (!timer) return;

        const wasRunning = timer.isRunning;
        if (wasRunning) pauseTimer(timerId);

        timer.originalDuration = newDuration;
        timer.remainingTime = newDuration;
        root.timers = timers.slice(0);
        saveTimers();

        if (wasRunning) startTimer(timerId);
    }

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (secs < 10 ? "0" : "") + secs;
        } else {
            return minutes + ":" + (secs < 10 ? "0" : "") + secs;
        }
    }

    function getProgressPercentage(timerId) {
        const timer = timers.find(t => t.id === timerId);
        if (!timer) return 0;

        return ((timer.originalDuration - timer.remainingTime) / timer.originalDuration) * 100;
    }

    function handleTimerTick(timerId) {
        const timer = timers.find(t => t.id === timerId);
        if (!timer || !timer.isRunning) return;

        const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
        timer.remainingTime = Math.max(0, timer.originalDuration - elapsed);

        if (timer.remainingTime <= 0) {
            timer.isRunning = false;
            timer.isPaused = false;
            if (timer.qtTimer) timer.qtTimer.stop();

            playSound("finish");
            showNotification("⏰ Timer Complete", `${timer.name} finished!`);
            timerFinished(timer.id, timer.name);
            saveTimers();
        }

        root.timers = timers.slice(0);
    }

    function refresh() {
        timerFileView.reload();
    }

    function cleanup() {
        for (let i = 0; i < timers.length; i++) {
            if (timers[i].qtTimer) timers[i].qtTimer.destroy();
        }
        timers = [];
        root.timers = [];
        saveTimers();
    }

    Component.onCompleted: refresh()

    Component {
        id: timerComponent
        Timer {
            property int timerId: -1
            onTriggered: root.handleTimerTick(timerId)
        }
    }

    FileView {
        id: timerFileView
        path: filePath
        onLoaded: {
            const fileContents = timerFileView.text();
            const loadedTimers = jsonToTimers(fileContents);

            timers = loadedTimers.map(timerData => ({
                id: timerData.id,
                name: timerData.name,
                originalDuration: timerData.originalDuration,
                remainingTime: timerData.remainingTime,
                isRunning: false,
                isPaused: timerData.isPaused || false,
                startTime: 0,
                pausedTime: 0,
                preset: timerData.preset,
                color: timerData.color || "#3498db",
                icon: timerData.icon || "timer",
                qtTimer: null
            }));

            root.timers = timers.slice(0);
            console.log("[Timer] Loaded", timers.length, "timers");
        }
        onLoadFailed: (error) => {
            if (error === FileViewError.FileNotFound) {
                console.log("[Timer] File not found, creating new.");
                root.timers = [];
                timerFileView.setText(timersToJson());
            } else {
                console.log("[Timer] Load failed: " + error);
            }
        }
    }
}
