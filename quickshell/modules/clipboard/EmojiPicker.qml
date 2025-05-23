import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Window
import Quickshell
import Qt.labs.platform 1.1
import "../../services/"

Window {
    id: emojiPickerWindow
    flags: Qt.ToolTip | Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint
    
    width: 460
    height: 400
    visible: false
    
    property var currentPage: "recent"
    
    // The emoji data file path
    readonly property string emojiDataFile: StandardPaths.writableLocation(StandardPaths.ConfigLocation) + "/quickshell/assets/emoji.json"
    
    // Recent emoji file path
    readonly property string recentEmojiFile: StandardPaths.writableLocation(StandardPaths.CacheLocation) + "/recent_emoji.json"
    
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
    
    Rectangle {
        anchors.fill: parent
        color: MaterialTheme.background
        radius: 12
        border.width: 1
        border.color: MaterialTheme.divider
        
        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 12
            spacing: 8
            
            // Top bar with search and category buttons
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 48
                color: "transparent"
                
                ScrollView {
                    id: topBarScroll
                    anchors.fill: parent
                    clip: true
                    ScrollBar.horizontal {
                        policy: ScrollBar.AsNeeded
                    }
                    ScrollBar.vertical {
                        policy: ScrollBar.AlwaysOff
                    }
                    
                    RowLayout {
                        id: topBar
                        width: Math.max(implicitWidth, topBarScroll.width)
                        height: parent.height
                        spacing: 8
                        
                        TextField {
                            id: searchField
                            Layout.preferredWidth: 150
                            Layout.fillHeight: true
                            placeholderText: "Search"
                            
                            onTextChanged: {
                                if (text.length > 0) {
                                    search(text)
                                    contentStack.currentIndex = 0 // Search page
                                } else if (currentPage === "search") {
                                    // Switch back to previous page if we were on search
                                    loadPage(currentPage)
                                }
                            }
                        }
                    }
                }
            }
            
            // Content stack for different pages
            StackLayout {
                id: contentStack
                Layout.fillWidth: true
                Layout.fillHeight: true
                
                // Search page (index 0)
                ScrollView {
                    id: searchPage
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    clip: true
                    ScrollBar.horizontal {
                        policy: ScrollBar.AsNeeded
                    }
                    ScrollBar.vertical {
                        policy: ScrollBar.AsNeeded
                    }
                    
                    GridLayout {
                        id: searchGrid
                        width: searchPage.width
                        columns: Math.floor(searchPage.width / 40)
                        rowSpacing: 8
                        columnSpacing: 8
                    }
                }
                
                // Recent page (index 1)
                ScrollView {
                    id: recentPage
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    clip: true
                    ScrollBar.horizontal {
                        policy: ScrollBar.AsNeeded
                    }
                    ScrollBar.vertical {
                        policy: ScrollBar.AsNeeded
                    }
                    
                    GridLayout {
                        id: recentGrid
                        width: recentPage.width
                        columns: Math.floor(recentPage.width / 40)
                        rowSpacing: 8
                        columnSpacing: 8
                    }
                }
                
                // Other category pages will be added dynamically
            }
        }
    }
    
    // Custom components defined inline
    
    // EmojiButton component
    Component {
        id: emojiButtonComponent
        
        Button {
            id: emojiButton
            
            property string emoji: ""
            property string tooltipText: ""
            
            Layout.preferredWidth: 40
            Layout.preferredHeight: 40
            
            flat: true
            
            contentItem: Text {
                text: emoji
                font.pixelSize: 20
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
            
            background: Rectangle {
                radius: 8
                color: emojiButton.hovered ? MaterialTheme.hover : "transparent"
            }
            
            ToolTip {
                visible: emojiButton.hovered
                text: tooltipText
                delay: 500
            }
            
            onClicked: {
                addRecentEmoji(tooltipText, emoji)
                copyToClipboard(emoji)
                emojiPickerWindow.hide()
            }
        }
    }
    
    // Category button component
    Component {
        id: categoryButtonComponent
        
        Button {
            id: categoryButton
            
            // property string icon: ""
            // property string category: ""
            // property bool highlighted: false
            
            Layout.preferredWidth: 40
            Layout.preferredHeight: 40
            
            flat: true
            
            contentItem: Text {
                text: icon
                font.family: "Material Icons"
                font.pixelSize: 24
                color: categoryButton.highlighted ? MaterialTheme.accent : MaterialTheme.foreground
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
            
            background: Rectangle {
                radius: 8
                color: {
                    if (categoryButton.highlighted) return Qt.alpha(MaterialTheme.accent, 0.2)
                    if (categoryButton.hovered) return MaterialTheme.hover
                    return "transparent"
                }
            }
            
            ToolTip {
                visible: categoryButton.hovered
                text: {
                    var txt = category
                    return txt.charAt(0).toUpperCase() + txt.slice(1).replace(/-/g, " ")
                }
                delay: 500
            }
            
            onClicked: {
                loadPage(category)
            }
        }
    }
    
    // Category page component
    Component {
        id: categoryPageComponent
        
        ScrollView {
            id: categoryPage
            
            property string category: ""
            
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true
            
            ColumnLayout {
                id: categoryLayout
                width: categoryPage.width
                spacing: 16
            }
            
            function clear() {
                while (categoryLayout.children.length > 0) {
                    categoryLayout.children[0].destroy()
                }
            }
            
            function addSubcategory(name) {
                var subcategory = subcategoryComponent.createObject(categoryLayout, {
                    "name": name
                })
                return subcategory
            }
        }
    }
    
    // Subcategory component
    Component {
        id: subcategoryComponent
        
        ColumnLayout {
            id: subcategory
            
            property string name: ""
            
            spacing: 8
            width: parent.width
            
            Label {
                text: formatSubcategoryTitle(name)
                font.bold: true
                color: MaterialTheme.foreground
                
                Layout.fillWidth: true
            }
            
            GridLayout {
                id: emojiGrid
                
                Layout.fillWidth: true
                
                columns: Math.floor(width / 40)
                rowSpacing: 8
                columnSpacing: 8
            }
            
            function formatSubcategoryTitle(text) {
                return text.charAt(0).toUpperCase() + text.slice(1).replace(/-/g, " ") + ":"
            }
            
            function addEmoji(emojiKey, emoji) {
                var button = emojiButtonComponent.createObject(emojiGrid, {
                    "emoji": emoji,
                    "tooltipText": formatEmojiKeyToTooltip(emojiKey)
                })
            }
        }
    }
    
    // Functions for initialization
    Component.onCompleted: {
        loadData()
        createCategoryButtons()
        createCategoryPages()
        loadRecentEmojis()
    }
    
    // Main functions
    function open() {
        centerInScreen()
        loadPage("recent")
        visible = true
    }
    
    function centerInScreen() {
        x = Screen.width / 2 - width / 2
        y = Screen.height / 2 - height / 2
    }
    
    // Load emoji data from JSON file
    function loadData() {
        try {
            var request = new XMLHttpRequest()
            request.open('GET', emojiDataFile, false)
            request.send(null)
            
            if (request.status === 200) {
                emojiData = JSON.parse(request.responseText)
                categories = Object.keys(emojiData)
                extractAllEmojis()
            } else {
                console.error("Could not read emoji data file:", emojiDataFile)
            }
        } catch (e) {
            console.error("Error loading emoji data:", e)
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
    
    // Load recent emojis from storage
    function loadRecentEmojis() {
        try {
            var request = new XMLHttpRequest()
            request.open('GET', recentEmojiFile, false)
            request.send(null)
            
            if (request.status === 200 && request.responseText && request.responseText.trim() !== "") {
                recentEmojis = JSON.parse(request.responseText)
            } else {
                recentEmojis = {}
            }
            updateRecentEmojis()
        } catch (e) {
            console.error("Error loading recent emojis:", e)
            recentEmojis = {}
            updateRecentEmojis()
        }
    }
    
    // Save recent emojis to storage
    function saveRecentEmojis() {
        try {
            var data = JSON.stringify(recentEmojis, null, 2)
            var request = new XMLHttpRequest()
            request.open('PUT', recentEmojiFile, false)
            request.send(data)
            
            if (request.status !== 200 && request.status !== 201) {
                console.error("Failed to write recent emojis:", request.status)
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
        updateRecentEmojis()
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
    
    // Create category buttons dynamically
    function createCategoryButtons() {
        // Add recent button first
        createCategoryButton("schedule", "recent", true)
        
        // Add category buttons
        for (var i = 0; i < categories.length; i++) {
            var category = categories[i]
            var icon = categoryIcons[category] || "emoji"
            createCategoryButton(icon, category, false)
        }
    }
    
    function createCategoryButton(icon, name, isHighlighted) {
        var button = categoryButtonComponent.createObject(topBar, {
            "icon": icon,
            "category": name,
            "highlighted": isHighlighted
        })
    }
    
    // Create category pages dynamically
    function createCategoryPages() {
        // Categories are already in the stack (search at 0, recent at 1)
        for (var i = 0; i < categories.length; i++) {
            var category = categories[i]
            var page = categoryPageComponent.createObject(contentStack, {
                "category": category
            })
        }
    }
    
    // Load a specific page
    function loadPage(pageName) {
        currentPage = pageName
        
        // Update button highlights
        for (var i = 0; i < topBar.children.length; i++) {
            var child = topBar.children[i]
            if (child.category !== undefined) {
                child.highlighted = (child.category === pageName)
            }
        }
        
        if (pageName === "search") {
            contentStack.currentIndex = 0
        } else if (pageName === "recent") {
            contentStack.currentIndex = 1
            loadRecentEmojis()
        } else {
            // Load category page
            var categoryIndex = categories.indexOf(pageName)
            if (categoryIndex >= 0) {
                contentStack.currentIndex = categoryIndex + 2 // +2 because of search and recent
                loadCategoryEmojis(pageName)
            }
        }
    }
    
    // Load category emojis and update the UI
    function loadCategoryEmojis(category) {
        if (!emojiData[category]) return
        
        var pageIndex = categories.indexOf(category) + 2
        var page = contentStack.itemAt(pageIndex)
        if (!page) return
        
        page.clear()
        
        var categoryObj = emojiData[category]
        for (var subcategory in categoryObj) {
            var subcategoryObj = page.addSubcategory(subcategory)
            var emojis = categoryObj[subcategory]
            
            for (var emojiKey in emojis) {
                subcategoryObj.addEmoji(emojiKey, emojis[emojiKey])
            }
        }
    }
    
    // Search for emojis
    function search(query) {
        if (!query || query.trim() === "") {
            searchResults = {}
            updateSearchResults()
            return
        }
        
        searchResults = {}
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
                searchResults[key] = allEmojis[key]
            }
        }
        
        updateSearchResults()
    }
    
    // Update search results grid
    function updateSearchResults() {
        // Clear existing results
        while (searchGrid.children.length > 0) {
            searchGrid.children[0].destroy()
        }
        
        // Add new results
        for (var key in searchResults) {
            var button = emojiButtonComponent.createObject(searchGrid, {
                "emoji": searchResults[key],
                "tooltipText": formatEmojiKeyToTooltip(key)
            })
        }
    }
    
    // Update recent emojis grid
    function updateRecentEmojis() {
        // Clear existing emojis
        while (recentGrid.children.length > 0) {
            recentGrid.children[0].destroy()
        }
        
        // Add new emojis
        for (var key in recentEmojis) {
            var button = emojiButtonComponent.createObject(recentGrid, {
                "emoji": recentEmojis[key],
                "tooltipText": formatEmojiKeyToTooltip(key)
            })
        }
    }
    
    // Format emoji key to readable tooltip
    function formatEmojiKeyToTooltip(key) {
        return key.replace(/^e\d+-\d+/, "").replace(/-/g, " ").trim()
    }
    
    // Copy emoji to clipboard
    function copyToClipboard(text) {
        Clipboard.text = text
    }
}


