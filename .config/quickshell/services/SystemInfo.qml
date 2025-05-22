pragma Singleton
pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Io

Singleton {
    property string distroName: "Unknown"
    property string distroId: "unknown"
    property string distroIcon: "linux-symbolic"
    property string username: "user"
    property bool hasbattery: false

    Timer {
        interval: 1
        running: true
        repeat: false
        onTriggered: {
            const upowerCheck = Qt.createQmlObject('import QtQuick; import QtQuick.Controls; Process { id: process; command: "upower -i /org/freedesktop/UPower/devices/battery_BAT0"; stdout: SplitParser { onRead: data => { const lines = data.split("\n"); for (let line of lines) { if (line.includes("present:")) { hasbattery = line.includes("yes"); break; } } } } }', parent)
            upowerCheck.start()
            
            // Wait for the process to finish
            Qt.callLater(function() {
                if (upowerCheck.exitCode !== 0) {
                    // Try BAT1 if BAT0 is not found
                    upowerCheck.command = "upower -i /org/freedesktop/UPower/devices/battery_BAT1"
                    upowerCheck.start()
                }
            })
        }
    }

    Timer {
        interval: 1
        running: true
        repeat: false
        onTriggered: {
            getUsername.running = true
            fileOsRelease.reload()
            const textOsRelease = fileOsRelease.text()

            // Extract the friendly name (PRETTY_NAME field, fallback to NAME)
            const prettyNameMatch = textOsRelease.match(/^PRETTY_NAME="(.+?)"/m)
            const nameMatch = textOsRelease.match(/^NAME="(.+?)"/m)
            distroName = prettyNameMatch ? prettyNameMatch[1] : (nameMatch ? nameMatch[1].replace(/Linux/i, "").trim() : "Unknown")

            // Extract the ID (LOGO field, fallback to "unknown")
            const logoMatch = textOsRelease.match(/^LOGO=(.+)$/m)
            distroId = logoMatch ? logoMatch[1].replace(/"/g, "") : "unknown"

            // Update the distroIcon property based on distroId
            switch (distroId) {
                case "arch": distroIcon = "arch-symbolic"; break;
                case "endeavouros": distroIcon = "endeavouros-symbolic"; break;
                case "cachyos": distroIcon = "cachyos-symbolic"; break;
                case "nixos": distroIcon = "nixos-symbolic"; break;
                case "fedora": distroIcon = "fedora-symbolic"; break;
                case "linuxmint":
                case "ubuntu":
                case "zorin":
                case "popos": distroIcon = "ubuntu-symbolic"; break;
                case "debian":
                case "raspbian":
                case "kali": distroIcon = "debian-symbolic"; break;
                default: distroIcon = "linux-symbolic"; break;
            }
        }
    }

    Process {
        id: getUsername
        command: ["whoami"]
        stdout: SplitParser {
            onRead: data => {
                username = data.trim()
            }
        }
    }

    FileView {
        id: fileOsRelease
        path: "/etc/os-release"
    }
}