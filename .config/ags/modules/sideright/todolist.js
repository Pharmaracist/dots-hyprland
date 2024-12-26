const Pango = imports.gi.Pango;

import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Button, Label, Revealer } = Widget;
import { MaterialIcon } from '../.commonwidgets/materialicon.js';
import { TabContainer } from '../.commonwidgets/tabcontainer.js';
import Todo from "../../services/todo.js";
import { setupCursorHover } from '../.widgetutils/cursorhover.js';

const TodoListItem = (task, id, isDone, isEven = false) => {
    let isEditing = false;

    const taskName = Widget.Label({
        hexpand: true,
        xalign: 0,
        wrap: true,
        className: `txt txt-small sidebar-todo-txt ${task.type === 'note' ? 'sidebar-todo-note' : ''}`,
        label: task.content,
        selectable: true,
        visible: true,
        wrapMode: Pango.WrapMode.WORD_CHAR,
    });

    const editEntry = Widget.Entry({
        className: 'txt-small sidebar-todo-entry',
        text: task.content,
        visible: false,
        onAccept: ({ text }) => {
            if (text === '') return;
            if (task.type === 'note')
                Todo.editNote(id, text);
            else
                Todo.edit(id, text);
            isEditing = false;
            taskName.visible = true;
            editEntry.visible = false;
            editButton.visible = true;
            saveButton.visible = false;
            cancelEditButton.visible = false;
        },
    });

    const editButton = Widget.Button({
        vpack: 'center',
        className: 'txt sidebar-todo-item-action',
        visible: true,
        child: MaterialIcon('edit', 'norm', { vpack: 'center' }),
        onClicked: () => {
            isEditing = true;
            taskName.visible = false;
            editEntry.visible = true;
            editEntry.text = task.content;
            editEntry.grab_focus();
            editButton.visible = false;
            saveButton.visible = true;
            cancelEditButton.visible = true;
        },
        setup: setupCursorHover,
    });

    const saveButton = Widget.Button({
        vpack: 'center',
        className: 'txt sidebar-todo-item-action',
        visible: false,
        child: MaterialIcon('save', 'norm', { vpack: 'center' }),
        onClicked: () => {
            if (editEntry.text === '') return;
            if (task.type === 'note')
                Todo.editNote(id, editEntry.text);
            else
                Todo.edit(id, editEntry.text);
            isEditing = false;
            taskName.visible = true;
            editEntry.visible = false;
            editButton.visible = true;
            saveButton.visible = false;
            cancelEditButton.visible = false;
        },
        setup: setupCursorHover,
    });

    const cancelEditButton = Widget.Button({
        vpack: 'center',
        className: 'txt sidebar-todo-item-action',
        visible: false,
        child: MaterialIcon('close', 'norm', { vpack: 'center' }),
        onClicked: () => {
            isEditing = false;
            taskName.visible = true;
            editEntry.visible = false;
            editButton.visible = true;
            saveButton.visible = false;
            cancelEditButton.visible = false;
            editEntry.text = task.content;
        },
        setup: setupCursorHover,
    });

    const actions = Box({
        hpack: 'end',
        className: 'spacing-h-5 sidebar-todo-actions',
        children: task.type === 'note' ? [
            editButton,
            saveButton,
            cancelEditButton,
            Widget.Button({ // Remove
                vpack: 'center',
                className: 'txt sidebar-todo-item-action',
                child: MaterialIcon('delete_forever', 'norm', { vpack: 'center' }),
                onClicked: () => {
                    const contentWidth = todoContent.get_allocated_width();
                    crosser.toggleClassName('sidebar-todo-crosser-removed', true);
                    crosser.css = `margin-left: -${contentWidth}px;`;
                    Utils.timeout(200, () => {
                        widgetRevealer.revealChild = false;
                    })
                    Utils.timeout(350, () => {
                        Todo.remove(id, task.type === 'note');
                    })
                },
                setup: setupCursorHover,
            }),
        ] : [
            editButton,
            saveButton,
            cancelEditButton,
            Widget.Button({ // Check/Uncheck
                vpack: 'center',
                className: 'txt sidebar-todo-item-action',
                child: MaterialIcon(`${isDone ? 'remove_done' : 'check'}`, 'norm', { vpack: 'center' }),
                onClicked: (self) => {
                    const contentWidth = todoContent.get_allocated_width();
                    crosser.toggleClassName('sidebar-todo-crosser-crossed', true);
                    crosser.css = `margin-left: -${contentWidth}px;`;
                    Utils.timeout(200, () => {
                        widgetRevealer.revealChild = false;
                    })
                    Utils.timeout(350, () => {
                        if (isDone)
                            Todo.uncheck(id);
                        else
                            Todo.check(id);
                    })
                },
                setup: setupCursorHover,
            }),
            Widget.Button({ // Remove
                vpack: 'center',
                className: 'txt sidebar-todo-item-action',
                child: MaterialIcon('delete_forever', 'norm', { vpack: 'center' }),
                onClicked: () => {
                    const contentWidth = todoContent.get_allocated_width();
                    crosser.toggleClassName('sidebar-todo-crosser-removed', true);
                    crosser.css = `margin-left: -${contentWidth}px;`;
                    Utils.timeout(200, () => {
                        widgetRevealer.revealChild = false;
                    })
                    Utils.timeout(350, () => {
                        Todo.remove(id, task.type === 'note');
                    })
                },
                setup: setupCursorHover,
            }),
        ]
    });

    const crosser = Widget.Box({
        className: 'sidebar-todo-crosser',
    });

    const todoContent = Box({
        className: `sidebar-todo-item ${isEven ? 'sidebar-todo-item-even' : ''}`,
        setup: (box) => {
            box.pack_start(Widget.Box({
                vertical: true,
                children: [
                    taskName,
                    editEntry,
                ]
            }), true, true, 0);
            box.pack_start(actions, false, false, 0);
            box.pack_start(crosser, false, false, 0);
        }
    });

    const widgetRevealer = Widget.Revealer({
        revealChild: true,
        transition: 'slide_down',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        child: todoContent,
    })
    return Box({
        homogeneous: true,
        children: [widgetRevealer]
    });
}

const noteItems = () => Widget.Scrollable({
    hscroll: 'never',
    vscroll: 'automatic',
    child: Widget.Box({
        vertical: true,
        className: 'spacing-v-5',
        setup: (self) => self
            .hook(Todo, (self) => {
                self.children = Todo.notes_json.map((note, i) => {
                    return TodoListItem(note, i, false);
                }).filter(Boolean);
                if (self.children.length == 0) {
                    self.homogeneous = true;
                    self.children = [
                        Widget.Box({
                            hexpand: true,
                            vertical: true,
                            vpack: 'center',
                            className: 'txt txt-subtext',
                            children: [
                                MaterialIcon('note', 'gigantic'),
                                Label({ label: getString('No notes yet!'), wrapMode: Pango.WrapMode.WORD_CHAR, })
                            ]
                        })
                    ]
                }
                else self.homogeneous = false;
            }, 'updated')
        ,
    }),
    setup: (listContents) => {
        const vScrollbar = listContents.get_vscrollbar();
        vScrollbar.get_style_context().add_class('sidebar-scrollbar');
    }
});

const todoItems = (isDone) => Widget.Scrollable({
    hscroll: 'never',
    vscroll: 'automatic',
    child: Widget.Box({
        vertical: true,
        className: 'spacing-v-5',
        setup: (self) => self
            .hook(Todo, (self) => {
                self.children = Todo.todo_json.map((task, i) => {
                    if (task.type === 'note') return null;
                    if (task.done != isDone) return null;
                    return TodoListItem(task, i, isDone);
                }).filter(Boolean);
                if (self.children.length == 0) {
                    self.homogeneous = true;
                    self.children = [
                        Widget.Box({
                            hexpand: true,
                            vertical: true,
                            vpack: 'center',
                            className: 'txt txt-subtext',
                            children: [
                                MaterialIcon(`${isDone ? 'checklist' : 'check_circle'}`, 'gigantic'),
                                Label({ label: `${isDone ? getString('Finished tasks will go here') : getString('Nothing here!')}`, wrapMode: Pango.WrapMode.WORD_CHAR, })
                            ]
                        })
                    ]
                }
                else self.homogeneous = false;
            }, 'updated')
        ,
    }),
    setup: (listContents) => {
        const vScrollbar = listContents.get_vscrollbar();
        vScrollbar.get_style_context().add_class('sidebar-scrollbar');
    }
});

const NotesList = () => {
    let isNote = true;
    const newNoteButton = Revealer({
        transition: 'slide_left',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        revealChild: true,
        child: Button({
            className: 'txt-small sidebar-todo-new',
            halign: 'end',
            vpack: 'center',
            label: getString('+ New note'),
            setup: setupCursorHover,
            onClicked: (self) => {
                newNoteButton.revealChild = false;
                newNoteEntryRevealer.revealChild = true;
                confirmAddNote.revealChild = true;
                cancelAddNote.revealChild = true;
                newNoteEntry.grab_focus();
            }
        })
    });

    const cancelAddNote = Revealer({
        transition: 'slide_right',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        revealChild: false,
        child: Button({
            className: 'txt-norm icon-material sidebar-todo-add',
            halign: 'end',
            vpack: 'center',
            label: 'close',
            setup: setupCursorHover,
            onClicked: (self) => {
                newNoteEntryRevealer.revealChild = false;
                confirmAddNote.revealChild = false;
                cancelAddNote.revealChild = false;
                newNoteButton.revealChild = true;
                newNoteEntry.text = '';
            }
        })
    });

    const newNoteEntry = Widget.Entry({
        vpack: 'center',
        className: 'txt-small sidebar-todo-entry',
        placeholderText: getString('Add a note...'),
        onAccept: ({ text }) => {
            if (text == '') return;
            Todo.addNote(text);
            newNoteEntry.text = '';
            newNoteEntryRevealer.revealChild = false;
            confirmAddNote.revealChild = false;
            cancelAddNote.revealChild = false;
            newNoteButton.revealChild = true;
        },
        onChange: ({ text }) => confirmAddNote.child.toggleClassName('sidebar-todo-add-available', text != ''),
    });

    const newNoteEntryRevealer = Revealer({
        transition: 'slide_right',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        revealChild: false,
        child: newNoteEntry,
    });

    const confirmAddNote = Revealer({
        transition: 'slide_right',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        revealChild: false,
        child: Button({
            className: 'txt-norm icon-material sidebar-todo-add',
            halign: 'end',
            vpack: 'center',
            label: 'arrow_upward',
            setup: setupCursorHover,
            onClicked: (self) => {
                if (newNoteEntry.text == '') return;
                Todo.addNote(newNoteEntry.text);
                newNoteEntry.text = '';
                newNoteEntryRevealer.revealChild = false;
                confirmAddNote.revealChild = false;
                cancelAddNote.revealChild = false;
                newNoteButton.revealChild = true;
            }
        })
    });

    return Box({
        vertical: true,
        className: 'spacing-v-5',
        setup: (box) => {
            box.pack_start(noteItems(), true, true, 0);
            box.pack_start(Box({
                setup: (self) => {
                    self.pack_start(cancelAddNote, false, false, 0);
                    self.pack_start(newNoteEntryRevealer, true, true, 0);
                    self.pack_start(confirmAddNote, false, false, 0);
                    self.pack_start(newNoteButton, false, false, 0);
                }
            }), false, false, 0);
        },
    });
}

const UndoneTodoList = () => {
    let isNote = false;
    const newTaskButton = Revealer({
        transition: 'slide_left',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        revealChild: true,
        child: Button({
            className: 'txt-small sidebar-todo-new',
            halign: 'end',
            vpack: 'center',
            label: getString('+ New task'),
            setup: setupCursorHover,
            onClicked: (self) => {
                newTaskButton.revealChild = false;
                newTaskEntryRevealer.revealChild = true;
                confirmAddTask.revealChild = true;
                cancelAddTask.revealChild = true;
                newTaskEntry.grab_focus();
                isNote = false;
                newTaskEntry.placeholderText = getString('Add a task...');
            }
        })
    });
    const cancelAddTask = Revealer({
        transition: 'slide_right',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        revealChild: false,
        child: Button({
            className: 'txt-norm icon-material sidebar-todo-add',
            halign: 'end',
            vpack: 'center',
            label: 'close',
            setup: setupCursorHover,
            onClicked: (self) => {
                newTaskEntryRevealer.revealChild = false;
                confirmAddTask.revealChild = false;
                cancelAddTask.revealChild = false;
                newTaskButton.revealChild = true;
                newTaskEntry.text = '';
            }
        })
    });
    const newTaskEntry = Widget.Entry({
        vpack: 'center',
        className: 'txt-small sidebar-todo-entry',
        placeholderText: getString('Add a task...'),
        onAccept: ({ text }) => {
            if (text == '') return;
            if (isNote)
                Todo.addNote(text);
            else
                Todo.add(text);
            newTaskEntry.text = '';
            newTaskEntryRevealer.revealChild = false;
            confirmAddTask.revealChild = false;
            cancelAddTask.revealChild = false;
            newTaskButton.revealChild = true;
        },
        onChange: ({ text }) => confirmAddTask.child.toggleClassName('sidebar-todo-add-available', text != ''),
    });

    const newTaskEntryRevealer = Revealer({
        transition: 'slide_right',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        revealChild: false,
        child: newTaskEntry,
    });

    const confirmAddTask = Revealer({
        transition: 'slide_right',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        revealChild: false,
        child: Button({
            className: 'txt-norm icon-material sidebar-todo-add',
            halign: 'end',
            vpack: 'center',
            label: 'arrow_upward',
            setup: setupCursorHover,
            onClicked: (self) => {
                if (newTaskEntry.text == '') return;
                if (isNote)
                    Todo.addNote(newTaskEntry.text);
                else
                    Todo.add(newTaskEntry.text);
                newTaskEntry.text = '';
                newTaskEntryRevealer.revealChild = false;
                confirmAddTask.revealChild = false;
                cancelAddTask.revealChild = false;
                newTaskButton.revealChild = true;
            }
        })
    });

    return Box({ // The list, with a New button
        vertical: true,
        className: 'spacing-v-5',
        setup: (box) => {
            box.pack_start(todoItems(false), true, true, 0);
            box.pack_start(Box({
                setup: (self) => {
                    self.pack_start(cancelAddTask, false, false, 0);
                    self.pack_start(newTaskEntryRevealer, true, true, 0);
                    self.pack_start(confirmAddTask, false, false, 0);
                    self.pack_start(newTaskButton, false, false, 0);
                }
            }), false, false, 0);
        },
    });
}

export const TodoWidget = () => TabContainer({
    icons: ['format_list_bulleted', 'task_alt', 'note'],
    names: [getString('Unfinished'), getString('Done'), getString('Notes')],
    children: [
        UndoneTodoList(),
        todoItems(true),
        NotesList(),
    ]
})