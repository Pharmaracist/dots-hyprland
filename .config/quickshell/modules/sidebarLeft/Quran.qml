import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Effects
import QtQuick.Layouts
import Quickshell
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

Item {
    id: root

    property var panelWindow
    property var inputField: searchField
    property bool showingSurah: false
    property var currentSurahData: null

    // Reset state when component is destroyed
    Component.onDestruction: {
        showingSurah = false;
        currentSurahData = null;
    }
    Component.onCompleted: {
        quranService.getSurahs();
    }

    QuranService {
        id: quranService

        onDataLoaded: {
            loadingSpinner.running = false;
            if (showingSurah) {
                currentSurahData = currentSurah;
            }
        }
        onErrorOccurred: function(message) {
            loadingSpinner.running = false;
            errorText.text = message;
            errorText.visible = true;
        }
    }

    ColumnLayout {
        id: mainLayout

        anchors.fill: parent
        spacing: 10

        // Header with back button when showing surah
        RowLayout {
            id: headerLayout

            Layout.fillWidth: true
            Layout.alignment: Qt.AlignHCenter
            visible: showingSurah
            spacing: 10

            MaterialSymbol {
                id: backButton

                text: "arrow_back"
                color: Appearance.m3colors.m3onSurface
                Layout.alignment: Qt.AlignVCenter

                MouseArea {
                    id: backButtonArea

                    anchors.fill: parent
                    onClicked: {
                        showingSurah = false;
                        currentSurahData = null;
                        quranService.getSurahs();
                    }
                }

            }

            Text {
                id: headerText

                text: currentSurahData ? currentSurahData.englishName + " (" + currentSurahData.name + ")" : ""
                color: Appearance.m3colors.m3onSurface
                font.bold: true
                font.pixelSize: Appearance.font.pixelSize.large
                Layout.alignment: Qt.AlignVCenter
            }

        }

        // Search bar
        Rectangle {
            id: inputWrapper

            Layout.fillWidth: true
            Layout.maximumWidth: 400
            Layout.alignment: Qt.AlignHCenter
            radius: Appearance.rounding.small
            color: Appearance.m3colors.m3surfaceVariant
            implicitHeight: 45
            border.color: Appearance.m3colors.m3outlineVariant
            border.width: 1

            TextField {
                id: searchField

                anchors.fill: parent
                anchors.margins: 5
                placeholderText: qsTr("Search in Quran...")
                color: Appearance.m3colors.m3onSurface
                font.pixelSize: Appearance.font.pixelSize.normal
                horizontalAlignment: TextInput.AlignHCenter
                onAccepted: {
                    if (text.length > 0) {
                        loadingSpinner.running = true;
                        errorText.visible = false;
                        quranService.search(text);
                    }
                }

                background: Item {
                }

            }

        }

        // Error text
        Text {
            id: errorText

            Layout.fillWidth: true
            Layout.maximumWidth: 600
            Layout.alignment: Qt.AlignHCenter
            color: Appearance.m3colors.m3error
            wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
            visible: false
        }

        // Loading spinner
        BusyIndicator {
            id: loadingSpinner

            running: true
            Layout.alignment: Qt.AlignHCenter
            palette.dark: Appearance.m3colors.m3primary
        }

        // Content area
        ScrollView {
            id: contentScrollView

            Layout.fillWidth: true
            Layout.fillHeight: true
            Layout.margins: 10
            clip: true

            ListView {
                id: contentList

                anchors.fill: parent
                anchors.leftMargin: 10
                anchors.rightMargin: 10
                model: showingSurah && currentSurahData ? [currentSurahData] : (quranService.currentSurah || [])
                spacing: 10
                clip: true
                // Optimize ListView performance
                cacheBuffer: 0
                displayMarginBeginning: 0
                displayMarginEnd: 0

                // Surah list item component
                Component {
                    id: surahComponent
                    Rectangle {
                        property real implicitHeight: surahLayout.implicitHeight + 20
                        width: parent.width
                        color: mouseArea.containsMouse ? Appearance.m3colors.m3surfaceVariant : Appearance.m3colors.m3surface
                        radius: Appearance.rounding.small
                        visible: Boolean(itemData) && typeof itemData.number === 'number'

                        MouseArea {
                            id: mouseArea
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: {
                                if (itemData && typeof itemData.number === 'number') {
                                    loadingSpinner.running = true;
                                    errorText.visible = false;
                                    showingSurah = true;
                                    quranService.getSurah(itemData.number);
                                }
                            }
                        }

                        RowLayout {
                            id: surahLayout
                            width: parent.width - 20
                            x: 10
                            y: 10
                            spacing: 10

                            Text {
                                text: typeof itemData?.number === 'number' ? itemData.number + "." : ""
                                color: Appearance.m3colors.m3primary
                                font.bold: true
                            }

                            Text {
                                text: itemData?.englishName || ""
                                color: Appearance.m3colors.m3onSurface
                                font.bold: true
                            }

                            Text {
                                text: itemData?.englishNameTranslation ? "(" + itemData.englishNameTranslation + ")" : ""
                                color: Appearance.m3colors.m3onSurfaceVariant
                            }

                            Item { Layout.fillWidth: true }

                            Text {
                                text: itemData?.name || ""
                                color: Appearance.m3colors.m3onSurface
                                font.family: "Noto Naskh Arabic"
                                Layout.alignment: Qt.AlignRight
                            }

                            Text {
                                text: (typeof itemData?.revelationType === 'string' && typeof itemData?.numberOfAyahs === 'number') ? 
                                    itemData.revelationType + " - " + itemData.numberOfAyahs + " verses" : ""
                                color: Appearance.m3colors.m3onSurfaceVariant
                                font.pointSize: 8
                            }
                        }
                    }
                }

                // Ayah (verse) component
                Component {
                    id: ayahComponent
                    Rectangle {
                        property real implicitHeight: ayahColumn.implicitHeight + 20
                        width: parent.width
                        color: Appearance.m3colors.m3surface
                        radius: Appearance.rounding.small
                        visible: Boolean(itemData) && Array.isArray(itemData.ayahs)

                        ColumnLayout {
                            id: ayahColumn
                            width: parent.width - 40
                            x: 20
                            y: 20
                            spacing: 20

                            Flow {
                                Layout.fillWidth: true
                                spacing: 12
                                layoutDirection: Qt.RightToLeft
                                
                                Repeater {
                                    model: Array.isArray(itemData?.ayahs) ? itemData.ayahs : []
                                    delegate: RowLayout {
                                        Layout.fillWidth: true
                                        spacing: 8
                                        layoutDirection: Qt.RightToLeft

                                        TextEdit {
                                            text: modelData?.text || ""
                                            color: Appearance.m3colors.m3onSurface
                                            font.family: "Noto Naskh Arabic"
                                            font.pixelSize: Appearance.font.pixelSize.large
                                            Layout.fillWidth: true
                                            wrapMode: Text.WordWrap
                                            horizontalAlignment: TextEdit.AlignCenter
                                            readOnly: true
                                            selectByMouse: true
                                            selectedTextColor: Appearance.m3colors.m3onPrimaryContainer
                                            selectionColor: Appearance.m3colors.m3primaryContainer
                                            textFormat: TextEdit.RichText
                                        }

                                        Text {
                                            text: typeof modelData?.numberInSurah === 'number' ? "﴿" + modelData.numberInSurah + "﴾" : ""
                                            color: Appearance.m3colors.m3onSurfaceVariant
                                            font.pixelSize: Appearance.font.pixelSize.small
                                            Layout.alignment: Qt.AlignRight | Qt.AlignTop
                                        }
                                    }
                                }
                            }

                            Text {
                                Layout.fillWidth: true
                                text: (typeof itemData?.englishName === 'string' && typeof itemData?.numberOfAyahs === 'number') ? 
                                    itemData.englishName + " - " + itemData.numberOfAyahs + " verses" : ""
                                color: Appearance.m3colors.m3onSurfaceVariant
                                font.pixelSize: Appearance.font.pixelSize.small
                                horizontalAlignment: Text.AlignCenter
                                visible: Boolean(itemData?.englishName) && typeof itemData?.numberOfAyahs === 'number'
                                wrapMode: Text.WordWrap
                            }
                        }
                    }
                }

                delegate: Loader {
                    id: delegateLoader

                    required property var model
                    required property int index
                    property var itemData: model || {
                    }

                    width: contentList.width
                    height: item ? item.implicitHeight + 20 : 0
                    asynchronous: true
                    sourceComponent: showingSurah ? ayahComponent : surahComponent
                    // Clear references when unloading
                    onStatusChanged: {
                        if (status === Loader.Null)
                            itemData = null;

                    }
                }

                layer.effect: OpacityMask {

                    maskSource: Rectangle {
                        width: contentList.width
                        height: contentList.height
                        radius: Appearance.rounding.small
                    }

                }

                add: Transition {
                    animations: [Appearance.animation.elementMoveEnter.numberAnimation.createObject(this, {
                        "property": "opacity",
                        "from": 0,
                        "to": 1
                    })]
                }

                remove: Transition {
                    animations: [Appearance.animation.elementMoveExit.numberAnimation.createObject(this, {
                        "property": "opacity",
                        "from": 1,
                        "to": 0
                    })]
                }

            }

        }

    }

}
