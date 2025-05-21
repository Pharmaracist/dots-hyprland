import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects
import Quickshell
import "../../services/"
import "../common/"
// This is the main component that will be imported by shell.qml
Item {
    id: emojiScope
    
    // This will be exported as the Clipboard component
    Component.onCompleted: {
        emojiPanel.visible = true
    }

PanelWindow {
    id: emojiPanel
    visible: true
    width: 400
    height: 350
    color: "transparent"
    anchors {
        bottom:true
        left:true
    }
    
    // Force focus when the panel becomes visible
    onVisibleChanged: {
        if (visible) {
            searchField.forceActiveFocus();
        }
    }
    property var currentPage: "recent"
    
    // Category icons mapping
    readonly property var categoryIcons: ({
        "smileys-emotion": "mood",
        "people-body": "emoji_people",
        "animals-nature": "pets",
        "food-drink": "emoji_food_beverage",
        "travel-places": "emoji_transportation",
        "activities": "sports_soccer",
        "objects": "emoji_objects",
        "symbols": "emoji_symbols",
        "flags": "flag"
    })
    
    // Data storage
    property var emojiData: ({})
    property var allEmojis: ({})
    property var recentEmojis: ({})
    property var searchResults: ({})
    property var categories: []
    
    // We don't need the toggle button anymore since the panel is always visible
    
    // Main panel content
    Rectangle {
        anchors.fill: parent
        color: Appearance.colors.colLayer1
        radius: Appearance.rounding.normal
        border.width: 1
        border.color: Appearance.colors.colSubtext
        
        // Add elevation shadow effect
        layer.enabled: true
        layer.effect: MultiEffect {
            shadowEnabled: true
            shadowColor: Appearance.colors.colShadow
            shadowHorizontalOffset: 0
            shadowVerticalOffset: 2
            shadowBlur: 1.0
            shadowOpacity: 0.5
            blurMax: 32
        }
        
        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 10
            spacing: 8
            
            // Header with close button
            RowLayout {
                Layout.fillWidth: true
                Layout.preferredHeight: 30
                
                Text {
                    text: "Emoji Picker"
                    font.bold: true
                    font.family: Appearance.font.family.title
                    font.pixelSize: Appearance.font.pixelSize.large
                    color: Appearance.colors.colOnLayer1
                    Layout.fillWidth: true
                }
                
                MaterialIconButton {
                    icon: "close"
                    onClicked: emojiPanel.visible = false
                }
            }
            
            // Search field using native Quickshell component
            MaterialTextField {
                id: searchField
                Layout.fillWidth: true
                Layout.preferredHeight: 36
                placeholderText: "Search emojis..."
                focus: true
                activeFocusOnTab: true
                
                onTextChanged: {
                    if (text.length > 0) {
                        search(text)
                    }
                }
                
                leftPadding: 30
                rightPadding: 10
                
                // Search icon
                Text {
                    text: "search"
                    font.family: Appearance.font.family.iconMaterial
                    font.pixelSize: 20
                    color: Appearance.colors.colOnLayer1Inactive
                    anchors.left: parent.left
                    anchors.leftMargin: 6
                    anchors.verticalCenter: parent.verticalCenter
                }
                
                // Clear button
                Button {
                    visible: searchField.text.length > 0
                    anchors.right: parent.right
                    anchors.rightMargin: 5
                    anchors.verticalCenter: parent.verticalCenter
                    width: 24
                    height: 24
                    flat: true
                    
                    contentItem: Text {
                        text: "close"
                        font.family: Appearance.font.family.iconMaterial
                        font.pixelSize: 16
                        color: Appearance.colors.colOnLayer1Inactive
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    
                    background: Rectangle {
                        radius: width / 2
                        color: parent.hovered ? Appearance.colors.colLayer2Hover : "transparent"
                    }
                    
                    onClicked: searchField.text = ""
                }
            }
            
            // Category buttons
            ScrollView {
                Layout.fillWidth: true
                Layout.preferredHeight: 50
                clip: true
                
                // Horizontal scrollbar
                property ScrollBar horizontalScrollBar: ScrollBar {
                    parent: parent
                    policy: ScrollBar.AsNeeded
                    orientation: Qt.Horizontal
                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.bottom: parent.bottom
                    contentItem: Rectangle {
                        implicitHeight: 6
                        radius: height / 2
                        color: Appearance.colors.colOnLayer1Inactive
                    }
                    background: Rectangle {
                        implicitHeight: 6
                        radius: height / 2
                        color: Appearance.colors.colLayer2
                    }
                }
                
                RowLayout {
                    id: categoryButtonsRow
                    spacing: 8
                    
                    // Will be filled dynamically
                }
            }
            
            // Emoji grid
            ScrollView {
                Layout.fillWidth: true
                Layout.fillHeight: true
                clip: true
                // Vertical scrollbar
                property ScrollBar verticalScrollBar: ScrollBar {
                    parent: parent
                    orientation: Qt.Vertical
                    policy: ScrollBar.AsNeeded
                    anchors.top: parent.top
                    anchors.bottom: parent.bottom
                    anchors.right: parent.right
                    contentItem: Rectangle {
                        implicitWidth: 6
                        radius: width / 2
                        color: Appearance.colors.colOnLayer1Inactive
                    }
                    background: Rectangle {
                        implicitWidth: 6
                        radius: width / 2
                        color: Appearance.colors.colLayer2
                    }
                }
                
                GridLayout {
                    id: emojiGrid
                    width: parent.width
                    columns: Math.floor(parent.width / 45)
                    rowSpacing: 6
                    columnSpacing: 6
                    
                    // Will be filled dynamically
                }
            }
        }
    }
    
    // Function to open emoji picker panel
    function openEmojiPicker() {
        console.log("Opening emoji panel")
        if (!emojiPanel.visible) {
            // Load data if not already loaded
            if (Object.keys(emojiData).length === 0) {
                loadData()
                createCategoryButtons()
                loadRecentEmojis()
                showCategory("recent")
            }
            emojiPanel.visible = true
        } else {
            emojiPanel.visible = false
        }
    }
    
    // Component functions for the emoji panel
    
    // Load emoji data from the JSON file
    function loadData() {
        try {
            var emojiDir = StandardPaths.writableLocation(StandardPaths.ConfigLocation) + "/quickshell/assets"
            var emojiFile = emojiDir + "/emoji.json"
            
            // Check if file exists and create it if it doesn't
            var checkFile = new XMLHttpRequest()
            checkFile.open("HEAD", "file://" + emojiFile, false)
            checkFile.send()
            
            if (checkFile.status !== 200) {
                console.log("Creating emoji data file...")
                var createDir = Qt.createQmlObject('import QtQuick; import Qt.labs.platform 1.1; Process { }', emojiPanel)
                createDir.startDetached("mkdir", ["-p", emojiDir])
                
                var download = Qt.createQmlObject('import QtQuick; import Qt.labs.platform 1.1; Process { }', emojiPanel)
                download.startDetached("curl", [
                    "-o", emojiFile,
                    "https://raw.githubusercontent.com/aylur/dotfiles/master/.config/ags/assets/emoji.json"
                ])
                
                // Wait a bit for the file to download
                var waitTimer = Qt.createQmlObject('import QtQuick 2.0; Timer {}', emojiPanel)
                waitTimer.interval = 2000
                waitTimer.repeat = false
                waitTimer.triggered.connect(function() { loadDataFromFile(emojiFile) })
                waitTimer.start()
                return
            }
            
            loadDataFromFile(emojiFile)
        } catch (e) {
            console.error("Error loading emoji data:", e)
        }
    }
    
    // Load data from the file
    function loadDataFromFile(filePath) {
        var request = new XMLHttpRequest()
        request.open("GET", "file://" + filePath, false)
        request.send()
        
        if (request.status === 200) {
            try {
                emojiData = JSON.parse(request.responseText)
                categories = Object.keys(emojiData)
                extractAllEmojis()
            } catch (e) {
                console.error("Error parsing emoji data:", e)
            }
        } else {
            console.error("Could not load emoji file:", filePath)
        }
    }
    
    // Extract all emojis into a flat structure for searching
    function extractAllEmojis() {
        allEmojis = {}
        for (var category in emojiData) {
            var categoryData = emojiData[category]
            for (var subcategory in categoryData) {
                var subcategoryData = categoryData[subcategory]
                for (var emojiKey in subcategoryData) {
                    allEmojis[emojiKey] = subcategoryData[emojiKey]
                }
            }
        }
    }
    
    // Create category buttons
    function createCategoryButtons() {
        // Clear any existing buttons
        while (categoryButtonsRow.children.length > 0) {
            categoryButtonsRow.children[0].destroy()
        }
        
        // Recent button first
        createCategoryButton("schedule", "recent")
        
        // Category buttons
        for (var i = 0; i < categories.length; i++) {
            var category = categories[i]
            var icon = categoryIcons[category] || "emoji_symbols"
            createCategoryButton(icon, category)
        }
    }
    
    // Create a single category button using MaterialButton
    function createCategoryButton(icon, name) {
        var btn = Qt.createQmlObject(
            'import QtQuick 2.12; import QtQuick.Controls 2.12; import Quickshell; MaterialIconButton { \n' +
            '   icon: "' + icon + '"; \n' +
            '   property string category: "' + name + '"; \n' +
            '   property bool highlighted: false; \n' +
            '   iconColor: highlighted ? Appearance.m3colors.m3primary : Appearance.colors.colOnLayer1; \n' +
            '   accentBgWhenHovered: true; \n' +
            '   fillBgWhenHighlighted: true; \n' +
            '   highlighted: highlighted; \n' +
            '   MaterialToolTip { \n' +
            '       visible: parent.hovered; \n' +
            '       text: formatCategoryName("' + name + '"); \n' +
            '       delay: 500; \n' +
            '   } \n' +
            '}',
            categoryButtonsRow
        )
        
        btn.clicked.connect(function() {
            showCategory(name)
        })
        
        btn.implicitWidth = 44
        btn.implicitHeight = 44
        
        return btn
    }
    
    // Show a specific category of emojis
    function showCategory(categoryName) {
        currentPage = categoryName
        
        // Clear grid
        while (emojiGrid.children.length > 0) {
            emojiGrid.children[0].destroy()
        }
        
        // Highlight active category button
        for (var i = 0; i < categoryButtonsRow.children.length; i++) {
            var btn = categoryButtonsRow.children[i]
            if (btn.category) {
                btn.highlighted = (btn.category === categoryName)
            }
        }
        
        if (categoryName === "recent") {
            showRecentEmojis()
        } else if (categoryName in emojiData) {
            showCategoryEmojis(categoryName)
        }
    }
    
    // Show recent emojis
    function showRecentEmojis() {
        for (var key in recentEmojis) {
            createEmojiButton(key, recentEmojis[key])
        }
    }
    
    // Show category emojis
    function showCategoryEmojis(category) {
        var categoryData = emojiData[category]
        for (var subcategory in categoryData) {
            var subcategoryData = categoryData[subcategory]
            for (var emojiKey in subcategoryData) {
                createEmojiButton(emojiKey, subcategoryData[emojiKey])
            }
        }
    }
    
    // Create emoji button using MaterialButton
    function createEmojiButton(key, emoji) {
        var btn = Qt.createQmlObject(
            'import QtQuick 2.12; import QtQuick.Controls 2.12; import Quickshell; MaterialButton {
' +
            '   text: "' + emoji + '";
' +
            '   property string emojiKey: "' + key + '";
' +
            '   font.pixelSize: 24;
' +
            '   flat: true;
' +
            '   MaterialToolTip {
' +
            '       visible: parent.hovered;
' +
            '       text: "' + formatTooltip(key) + '";
' +
            '       delay: 500;
' +
            '   }
' +
            '}',
            emojiGrid
        );
        
        btn.clicked.connect(function() {
            copyToClipboard(emoji);
            addRecentEmoji(key, emoji);
        });
        
        btn.implicitWidth = 45;
        btn.implicitHeight = 45;
        
        return btn;
    }
    
    // Format emoji key to readable tooltip
    function formatTooltip(key) {
        return key.replace(/^e\d+-\d+/, "").replace(/-/g, " ").trim()
    }
    
    // Format category name for display
    function formatCategoryName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ")
    }
    
    // Search for emojis
    function search(query) {
        currentPage = "search"
        
        // Clear grid
        while (emojiGrid.children.length > 0) {
            emojiGrid.children[0].destroy()
        }
        
        var terms = query.toLowerCase().split(" ")
        for (var key in allEmojis) {
            var match = true
            for (var i = 0; i < terms.length; i++) {
                if (!key.toLowerCase().includes(terms[i])) {
                    match = false
                    break
                }
            }
            
            if (match) {
                createEmojiButton(key, allEmojis[key])
            }
        }
    }
    
    // Load recent emojis
    function loadRecentEmojis() {
        try {
            var recentFile = StandardPaths.writableLocation(StandardPaths.CacheLocation) + "/recent_emoji.json"
            var request = new XMLHttpRequest()
            request.open("GET", "file://" + recentFile, false)
            request.send()
            
            if (request.status === 200 && request.responseText && request.responseText.trim() !== "") {
                recentEmojis = JSON.parse(request.responseText)
            } else {
                recentEmojis = {}
            }
        } catch (e) {
            console.error("Error loading recent emojis:", e)
            recentEmojis = {}
        }
    }
    
    // Save recent emojis
    function saveRecentEmojis() {
        try {
            var recentFile = StandardPaths.writableLocation(StandardPaths.CacheLocation) + "/recent_emoji.json"
            var data = JSON.stringify(recentEmojis, null, 2)
            var request = new XMLHttpRequest()
            request.open("PUT", "file://" + recentFile, false)
            request.send(data)
            
            if (request.status !== 200 && request.status !== 201) {
                console.error("Failed to write recent emojis file, status:", request.status)
            }
        } catch (e) {
            console.error("Error saving recent emojis:", e)
        }
    }
    
    // Add an emoji to recent list
    function addRecentEmoji(name, emoji) {
        recentEmojis[name] = emoji
        recentEmojis = moveItemToFront(name, recentEmojis)
        saveRecentEmojis()
    }
    
    // Move an item to the front of an object
    function moveItemToFront(item, obj) {
        var newObj = {}
        newObj[item] = obj[item]
        
        for (var key in obj) {
            if (key !== item) {
                newObj[key] = obj[key]
            }
        }
        
        return newObj
    }
    
    // Copy emoji to clipboard
    function copyToClipboard(text) {
        var clipboard = Qt.createQmlObject('import QtQuick 2.0; QtObject {}', emojiPanel)
        clipboard.clip = text
        
        var process = Qt.createQmlObject('import QtQuick 2.0; import Qt.labs.platform 1.1; Process {}', emojiPanel)
        process.startDetached("wl-copy", [text])
        
        console.log("Copied to clipboard:", text)
    }
    
    // Initialize the component
    Component.onCompleted: {
        // The emoji data will be loaded when the panel is first opened
    }
}
}