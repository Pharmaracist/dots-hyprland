import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Effects
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import "root:/modules/common"
import "root:/modules/common/functions/file_utils.js" as FileUtils
import "root:/modules/common/functions/string_utils.js" as StringUtils
import "root:/modules/common/widgets"
import "root:/services"

ShellRoot {
    property string time
    property ShellScreen modelData: Quickshell.screens[1]
    property int commonRadius: Appearance.rounding.screenRounding
    property bool showResources: true
    property bool showGallary: true
    property bool showScreenTime: true

    PanelWindow {
        exclusiveZone: -1
        screen: modelData
        WlrLayershell.layer: WlrLayer.Background
        color: "transparent"
        implicitWidth: (showScreenTime ? screenTime.implicitWidth : 0) + (showGallary ? gallaryContainer.implicitWidth : 0) + Appearance.sizes.floatingMargin
        implicitHeight: (showScreenTime ? screenTime.implicitHeight : 0) + (showResources ? resources.implicitHeight : 0) + Appearance.sizes.floatingMargin

        anchors {
            bottom: true
            right: true
        }

        margins {
            bottom: Appearance.sizes.floatingMargin
            right: Appearance.sizes.floatingMargin
        }

        ColumnLayout {
            RowLayout {
                spacing: 10

                Rectangle {
                    id: screenTime

                    visible: showScreenTime
                    radius: commonRadius
                    border.width: 1
                    border.color: Appearance.colors.colLayer2Hover
                    color: Appearance.colors.colLayer0
                    implicitWidth: 160
                    implicitHeight: 160

                    RectangularShadow {
                        anchors.fill: parent
                        radius: commonRadius
                        blur: 1.2 * Appearance.sizes.elevationMargin
                        spread: 1
                        color: Appearance.colors.colShadow
                    }

                    Rectangle {
                        width: parent.width - 10
                        height: parent.width - 10
                        anchors.centerIn: parent
                        radius: commonRadius
                        color: Appearance.colors.colLayer1
                        z: 0

                        Item {
                            width: parent.width
                            height: parent.height

                            CustomIcon {
                                id: treeIcon

                                width: parent.width
                                height: parent.height
                                source: "logo-symbolic"
                            }

                            ColorOverlay {
                                anchors.fill: treeIcon
                                source: treeIcon
                                color: Appearance.colors.colSecondaryContainerActive
                            }

                        }

                    }

                    Text {
                        color: Appearance.colors.colOnLayer2
                        font.pixelSize: 15
                        opacity: 0.6
                        text: "Screen Time"

                        anchors {
                            left: parent.left
                            leftMargin: 15
                            top: parent.top
                            topMargin: 15
                        }

                    }

                    ColumnLayout {
                        id: screenTimeContent

                        anchors.bottom: parent.bottom
                        anchors.bottomMargin: 20
                        anchors.horizontalCenter: parent.horizontalCenter

                        StyledText {
                            font.pixelSize: 30
                            font.bold: true
                            color: Appearance.colors.colOnLayer1
                            text: StringUtils.format(DateTime.uptime)
                            opacity: 0.85
                            textFormat: Text.MarkdownText
                        }

                    }

                }

                Rectangle {
                    id: gallaryContainer

                    visible: showGallary
                    radius: commonRadius
                    border.width: 1
                    border.color: Appearance.colors.colLayer2Hover
                    color: Appearance.colors.colLayer0
                    implicitWidth: 160
                    implicitHeight: 160

                    RectangularShadow {
                        anchors.fill: parent
                        radius: parent.radius
                        blur: 1.2 * Appearance.sizes.elevationMargin
                        spread: 1
                        color: Appearance.colors.colShadow
                    }

                    Text {
                        color: Appearance.colors.colOnLayer2
                        font.pixelSize: 15
                        opacity: 0.6
                        text: "memories"
                        z: 100

                        anchors {
                            left: parent.left
                            leftMargin: 15
                            top: parent.top
                            topMargin: 15
                        }

                    }

                    Image {
                        id: gallaryContent

                        anchors.centerIn: parent
                        anchors.fill: parent
                        source: Directories.pictures + "/gallary"
                        fillMode: Image.PreserveAspectCrop
                        sourceSize.width: gallaryContainer.width - 20
                        sourceSize.height: gallaryContainer.height - 20
                        asynchronous: true
                        antialiasing: true
                        // Rounded corners mask
                        layer.enabled: true

                        layer.effect: OpacityMask {

                            maskSource: Rectangle {
                                width: gallaryContent.width
                                height: gallaryContent.height
                                radius: commonRadius
                            }

                        }

                    }

                }

            }

            Rectangle {
                id: resources

                visible: showResources
                radius: commonRadius
                border.width: 1
                border.color: Appearance.colors.colLayer2Hover
                color: Appearance.colors.colLayer0
                implicitWidth: 330
                implicitHeight: 160

                RectangularShadow {
                    anchors.fill: parent
                    radius: commonRadius
                    blur: 1.2 * Appearance.sizes.elevationMargin
                    spread: 1
                    color: Appearance.colors.colShadow
                }

                Rectangle {
                    width: parent.width - 10
                    height: parent.height - 10
                    anchors.centerIn: parent
                    radius: commonRadius
                    color: Appearance.colors.colLayer1
                    z: 0
                }

                Text {
                    color: Appearance.colors.colOnLayer2
                    font.pixelSize: 15
                    opacity: 0.6
                    text: "Resources"

                    anchors {
                        left: parent.left
                        leftMargin: 15
                        top: parent.top
                        topMargin: 15
                    }

                }
                // Resourcess

                RowLayout {
                    // Resource {
                    //     iconName: "settings_slow_motion"
                    //     percentage: ResourceUsage.cpuUsage
                    // }
                    // Resource {
                    //     iconName: "settings_slow_motion"
                    //     percentage: ResourceUsage.cpuUsage
                    // }

                    anchors.centerIn: parent

                    Resource {
                        iconName: "memory"
                        percentage: ResourceUsage.memoryUsedPercentage
                    }

                    Resource {
                        iconName: "swap_horiz"
                        percentage: ResourceUsage.swapUsedPercentage
                    }

                    Resource {
                        iconName: "settings_slow_motion"
                        percentage: ResourceUsage.cpuUsage
                    }

                }

            }

        }

        mask: Region {
        }

    }

}
