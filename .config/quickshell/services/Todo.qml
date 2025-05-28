pragma Singleton
pragma ComponentBehavior: Bound

import "root:/modules/common"
import Quickshell;
import Quickshell.Io;
import Qt.labs.platform
import QtQuick;

Singleton {
    id: root
    property var filePath: `${Directories.state}/user/todo.md`
    property var list: []

    function listToMarkdown() {
        let mdText = "";
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            const doneMarker = item.done ? "x" : " ";
            mdText += `- [${doneMarker}] ${item.content}\n`;
        }
        return mdText;
    }

    function markdownToList(mdText) {
        const items = [];
        const lines = mdText.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
                const done = line[2] === 'x';
                const content = line.substring(6).trim();
                items.push({"content": content, "done": done});
            }
        }
        return items;
    }

    function addItem(item) {
        list.push(item)
        // Reassign to trigger onListChanged
        root.list = list.slice(0)
        todoFileView.setText(listToMarkdown())
    }

    function addTask(desc) {
        const item = {
            "content": desc,
            "done": false,
        }
        addItem(item)
    }

    function markDone(index) {
        if (index >= 0 && index < list.length) {
            list[index].done = true
            // Reassign to trigger onListChanged
            root.list = list.slice(0)
            todoFileView.setText(listToMarkdown())
        }
    }

    function markUnfinished(index) {
        if (index >= 0 && index < list.length) {
            list[index].done = false
            // Reassign to trigger onListChanged
            root.list = list.slice(0)
            todoFileView.setText(listToMarkdown())
        }
    }

    function deleteItem(index) {
        if (index >= 0 && index < list.length) {
            list.splice(index, 1)
            // Reassign to trigger onListChanged
            root.list = list.slice(0)
            todoFileView.setText(listToMarkdown())
        }
    }

    function refresh() {
        todoFileView.reload()
    }

    Component.onCompleted: {
        refresh()
    }

    FileView {
        id: todoFileView
        path: filePath
        onLoaded: {
            const fileContents = todoFileView.text()
            root.list = markdownToList(fileContents)
            console.log("[To Do] File loaded")
        }
        onLoadFailed: (error) => {
            if(error == FileViewError.FileNotFound) {
                console.log("[To Do] File not found, creating new file.")
                root.list = []
                todoFileView.setText(listToMarkdown())
            } else {
                console.log("[To Do] Error loading file: " + error)
            }
        }
    }
}
