import QtQuick
import Quickshell
pragma Singleton
pragma ComponentBehavior: Bound

Singleton {
    property QtObject ai: QtObject {
        property string model
        property real temperature: 0.5
        }
    property QtObject dock: QtObject {
        property bool pinnedOnStartup:true
        
        }

        property QtObject sidebar: QtObject {
            property QtObject attachments: QtObject {
                property bool extended: true
                }

                property QtObject bottomGroup: QtObject {
                    property bool collapsed: false
                    }
                    property QtObject centerGroup: QtObject {
                        property int selectedTab: 0
                        }
                    }

                    property QtObject booru: QtObject {
                        property bool allowNsfw: false
                            property string provider: "yandere"
                            }
                            property QtObject temp: QtObject {
                                property bool enableTransparency: false
                                }

                                property QtObject bar: QtObject {
                                    property int currentLayout: -1  // -1 means use first layout until user changes it
                                    }
                                }
