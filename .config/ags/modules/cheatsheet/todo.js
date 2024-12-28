import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import Todo from '../../services/todo.js';
import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import Gtk from 'gi://Gtk';
import GdkPixbuf from 'gi://GdkPixbuf';
import Gdk from 'gi://Gdk';
import Pango from 'gi://Pango';

const { Box, Button, Entry, EventBox, Label, Revealer, Stack, Scrollable, Overlay } = Widget;
const { Gravity } = imports.gi.Gdk;
const { Align, Orientation } = imports.gi.Gtk;
const { Gio, GLib } = imports.gi;

const TodoItem = (task, id) => {
    const taskContent = Box({
        className: 'task-content',
        children: [
            Label({
                label: task.content,
                hexpand: true,
                xalign: 0,
                justification: 'left',
                wrap: true,
                wrapMode: Pango.WrapMode.WORD_CHAR,
                css: `margin-left: 8px; color: ${task.done ? '@onLayer1Secondary' : '@onLayer1'};`,
            }),
        ],
    });

    const crosser = Widget.Box({
        className: 'task-crosser',
    });

    const widgetRevealer = Widget.Revealer({
        revealChild: true,
        transition: 'slide_down',
        transitionDuration: 250,
        child: Box({
            className: task.done ? 'todo-item todo-done' : 'todo-item',
            child: Box({
                children: [
                    Box({
                        vertical: true,
                        children: [
                            Box({
                                spacing: 8,
                                css: 'padding: 8px;',
                                setup: (box) => {
                                    box.pack_start(Button({
                                        className: 'todo-check-btn',
                                        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px; background-color: @layer2;',
                                        child: Label({
                                            className: 'icon-material',
                                            label: task.done ? 'radio_button_checked' : 'radio_button_unchecked',
                                            css: 'font-size: 16px; color: @accent;',
                                        }),
                                        onClicked: () => {
                                            if (task.done) {
                                                Todo.uncheck(id);
                                            } else {
                                                Todo.check(id);
                                            }
                                        },
                                    }), false, false, 0);
                                    
                                    box.pack_start(taskContent, true, true, 0);
                                    
                                    box.pack_start(Button({
                                        className: 'todo-delete-btn',
                                        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px; background-color: @layer2;',
                                        child: Label({
                                            className: 'icon-material',
                                            label: 'delete',
                                            css: 'font-size: 16px; color: @error;',
                                        }),
                                        onClicked: () => {
                                            Todo.remove(id, task.type === 'note');
                                        },
                                    }), false, false, 0);
                                    
                                    box.pack_start(crosser, false, false, 0);
                                },
                            }),
                        ],
                    }),
                ],
            }),
        }),
    });

    return widgetRevealer;
};

const NoteItem = (note, id) => {
    const noteContent = Box({
        className: 'note-content',
        children: [
            Label({
                label: note.content,
                hexpand: true,
                xalign: 0,
                justification: 'left',
                wrap: true,
                wrapMode: Pango.WrapMode.WORD_CHAR,
                css: 'margin-left: 8px; color: @onLayer1;',
            }),
        ],
    });

    const crosser = Widget.Box({
        className: 'task-crosser',
    });

    const widgetRevealer = Widget.Revealer({
        revealChild: true,
        transition: 'slide_down',
        transitionDuration: 250,
        child: Button({
            className: 'note-item',
            css: 'background-color: @layer1; border-radius: 8px; padding: 4px; margin: 2px 0;',
            child: Box({
                children: [
                    Box({
                        vertical: true,
                        children: [
                            Box({
                                spacing: 8,
                                css: 'padding: 8px;',
                                setup: (box) => {
                                    box.pack_start(Box({
                                        hexpand: true,
                                        children: [noteContent],
                                    }), true, true, 0);

                                    box.pack_end(Button({
                                        className: 'delete-button',
                                        child: Label({
                                            className: 'icon-material',
                                            label: 'delete',
                                        }),
                                        onClicked: () => {
                                            Todo.remove(id, note.type === 'note');
                                        },
                                    }), false, false, 0);
                                },
                            }),
                        ],
                    }),
                ],
            }),
        }),
    });

    return widgetRevealer;
};

const ImageItem = (image, id) => {
    let pixbuf;
    try {
        pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(
            image.path,
            200,  // width
            112,  // height
            true  // preserve aspect ratio
        );
    } catch (e) {
        print(`Error loading image: ${e}`);
    }

    return Box({
        className: 'image-item',
        vertical: true,
        spacing: 4,
        children: [
            Button({
                className: 'image-container',
                onClicked: () => {
                    Utils.execAsync(['xdg-open', image.path]);
                    App.closeWindow('cheatsheet');
                },
                child: Widget.DrawingArea({
                    className: 'image-drawing',
                    css: 'min-width: 200px; min-height: 112px; border-radius: 8px;',
                    setup: area => {
                        if (pixbuf) {
                            area.set_size_request(200, 112);
                            area.connect('draw', (widget, cr) => {
                                const scale = widget.get_scale_factor();
                                const width = widget.get_allocated_width();
                                const height = widget.get_allocated_height();

                                cr.arc(8, 8, 8, Math.PI, 1.5 * Math.PI);
                                cr.arc(width - 8, 8, 8, 1.5 * Math.PI, 2 * Math.PI);
                                cr.arc(width - 8, height - 8, 8, 0, 0.5 * Math.PI);
                                cr.arc(8, height - 8, 8, 0.5 * Math.PI, Math.PI);
                                cr.closePath();
                                cr.clip();

                                Gtk.render_background(
                                    widget.get_style_context(),
                                    cr,
                                    0, 0, width, height
                                );

                                cr.scale(1 / scale, 1 / scale);
                                Gdk.cairo_set_source_pixbuf(cr, pixbuf, 0, 0);
                                cr.paint();
                            });
                        }
                    },
                }),
            }),
            Box({
                className: 'image-info',
                spacing: 4,
                children: [
                    Button({
                        className: 'image-action-btn',
                        child: Label({
                            className: 'icon-material',
                            label: 'delete',
                            css: 'font-size: 16px;',
                        }),
                        onClicked: () => {
                            Todo.deleteImage(id);
                        },
                    }),
                    Box({
                        hexpand: true,
                        children: [
                            Label({
                                className: 'image-name',
                                label: image.name,
                                xalign: 0,
                                justification: 'left',
                                truncate: 'end',
                                maxWidthChars: 25,
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });
};

const PdfItem = (pdf, id) => {
    return Box({
        className: 'pdf-item',
        vertical: true,
        spacing: 4,
        css: 'min-width: 200px; max-width: 200px; background-color: @layer1; border-radius: 8px; margin: 4px;',
        children: [
            Button({
                className: 'pdf-container',
                onClicked: () => {
                    Utils.execAsync(['xdg-open', pdf.path]);
                    App.closeWindow('cheatsheet');
                },
                child: Overlay({
                    child: Box({
                        className: 'pdf-preview',
                        homogeneous: true,
                        css: 'min-width: 200px; min-height: 200px; border-radius: 8px; background-color: @layer2;',
                    }),
                    overlays: [
                        Label({
                            className: 'icon-material pdf-icon',
                            label: 'picture_as_pdf',
                            css: 'font-size: 64px; color: @onLayer2;',
                            hpack: 'center',
                            vpack: 'center',
                        }),
                    ],
                }),
            }),
            Box({
                className: 'pdf-info',
                spacing: 4,
                homogeneous: false,
                css: 'padding: 4px 8px 8px 8px;',
                children: [
                    Button({
                        className: 'pdf-action-btn',
                        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px; background-color: @layer2;',
                        onClicked: () => {
                            Todo.deletePdf(id);
                            updateContent();
                        },
                        child: Label({
                            className: 'icon-material',
                            label: 'delete',
                            css: 'font-size: 16px; color: @onLayer2;',
                            hpack: 'center',
                            vpack: 'center',
                        }),
                    }),
                    Label({
                        className: 'pdf-name',
                        label: pdf.name,
                        xalign: 0,
                        hexpand: true,
                        justification: 'left',
                        truncate: 'end',
                        maxWidthChars: 25,
                        css: 'margin-left: 4px; font-size: 14px; color: @onLayer1;',
                    }),
                ],
            }),
        ],
    });
};

const CategoryButton = (label, icon, onClicked, expanded = false) => {
    const revealer = Revealer({
        revealChild: expanded,
        transition: 'slide_down',
        transitionDuration: 200,
    });

    const button = Button({
        className: 'category-button',
        child: Box({
            children: [
                Label({
                    className: 'category-icon icon-material',
                    label: expanded ? 'expand_more' : 'chevron_right',
                }),
                Label({
                    className: 'category-icon icon-material',
                    label: icon,
                }),
                Label({
                    className: 'category-label',
                    label: label,
                }),
            ],
        }),
        onClicked: () => {
            revealer.revealChild = !revealer.revealChild;
            button.child.children[0].label = revealer.revealChild ? 'expand_more' : 'chevron_right';
            if (onClicked) onClicked();
        },
    });

    return Box({
        vertical: true,
        children: [
            button,
            revealer,
        ],
    });
};

export default () => {
    const contentEntry = Entry({
        className: 'content-entry',
        placeholderText: 'New Todo',
        hpack: 'center',
        halign: '',
        hexpand: true,
        onAccept: ({ text }) => {
            if (!text) return;
            
            if (contentStack.shown === 'current' || contentStack.shown === 'done') {
                Todo.add(text);
            } else if (contentStack.shown === 'notes') {
                Todo.addNote(text);
            }
            
            contentEntry.text = '';
        },
    });

    const todoAddButton = Button({
        className: 'add-button',
        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px; background-color: @layer2;',
        child: Box({
            children: [
                Label({
                    className: 'icon-material',
                    label: 'add',
                    css: 'font-size: 16px; color: @accent; margin-right: 4px;',
                }),
                Label({
                    label: 'Add Task',
                    css: 'color: @onLayer2;',
                }),
            ],
        }),
        onClicked: () => {
            const text = contentEntry.text.trim();
            if (text) {
                Todo.add(text);
                contentEntry.text = '';
                updateContent();
            }
        },
    });

    const noteAddButton = Button({
        className: 'add-button',
        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px; background-color: @layer2;',
        child: Box({
            children: [
                Label({
                    className: 'icon-material',
                    label: 'add',
                    css: 'font-size: 16px; color: @accent; margin-right: 4px;',
                }),
                Label({
                    label: 'Add Note',
                    css: 'color: @onLayer2;',
                }),
            ],
        }),
        onClicked: () => {
            const text = contentEntry.text.trim();
            if (text) {
                Todo.addNote(text);
                contentEntry.text = '';
                updateContent();
            }
        },
    });

    const imageAddButton = Button({
        className: 'add-button',
        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px; background-color: @layer2;',
        child: Box({
            children: [
                Label({
                    className: 'icon-material',
                    label: 'add',
                    css: 'font-size: 16px; color: @accent; margin-right: 4px;',
                }),
                Label({
                    label: 'Add Image',
                    css: 'color: @onLayer2;',
                }),
            ],
        }),
        onClicked: () => {
            Utils.execAsync(['zenity', '--file-selection', '--title=Select Image', '--file-filter=Images | *.png *.jpg *.jpeg *.gif *.webp'])
                .then(path => {
                    if (path) {
                        path = path.trim();
                        console.log('Selected image path:', path);
                        if (Todo.addImage(path)) {
                            console.log('Image added successfully');
                            Todo.notify('images_json');
                            updateContent();
                        } else {
                            console.log('Failed to add image');
                        }
                    }
                })
                .catch(error => {
                    console.error('Error selecting image:', error);
                });
        },
    });

    const pdfAddButton = Button({
        className: 'add-button',
        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px; background-color: @layer2;',
        child: Box({
            children: [
                Label({
                    className: 'icon-material',
                    label: 'add',
                    css: 'font-size: 16px; color: @accent; margin-right: 4px;',
                }),
                Label({
                    label: 'Add PDF',
                    css: 'color: @onLayer2;',
                }),
            ],
        }),
        onClicked: () => {
            Utils.execAsync(['zenity', '--file-selection', '--title=Select PDF', '--file-filter=PDF Files | *.pdf'])
                .then(path => {
                    if (path) {
                        path = path.trim();
                        console.log('Selected PDF path:', path);
                        if (Todo.addPdf(path)) {
                            console.log('PDF added successfully');
                            Todo.notify('pdfs_json');
                            updateContent();
                        } else {
                            console.log('Failed to add PDF');
                        }
                    }
                })
                .catch(error => {
                    console.error('Error selecting PDF:', error);
                });
        },
    });

    const entryBox = Box({
        className: 'entry-box',
        spacing: 8,
        children: [
            contentEntry,
            Stack({
                transition: 'slide_up_down',
                transitionDuration: 200,
                items: [
                    ['current', todoAddButton],
                    ['done', todoAddButton],
                    ['notes', noteAddButton],
                    ['images', imageAddButton],
                    ['pdfs', pdfAddButton]
                ],
                setup: self => {
                    self.shown = 'current';
                    self.connect('notify::shown', () => {
                        if (self.shown === 'current' || self.shown === 'done') {
                            contentEntry.placeholderText = 'New Todo';
                        } else if (self.shown === 'notes') {
                            contentEntry.placeholderText = 'New Note';
                        } else if (self.shown === 'images') {
                            contentEntry.placeholderText = 'Select Image';
                        } else if (self.shown === 'pdfs') {
                            contentEntry.placeholderText = 'Select PDF';
                        }
                    });
                },
            }),
        ],
    });

    const contentList = Box({
        className: 'content-list',
        vertical: true,
        spacing: 8,
        css: 'min-height: 400px; overflow-y: auto; padding: 12px;',
    });

    const doneList = Box({
        className: 'content-list',
        vertical: true,
        spacing: 8,
        css: 'min-height: 400px; overflow-y: auto; padding: 12px;',
    });

    const noteList = Box({
        className: 'content-list',
        vertical: true,
        spacing: 8,
        css: 'min-height: 400px; overflow-y: auto; padding: 12px;',
    });

    const imageList = Box({
        className: 'image-grid',
        vertical: true,
        spacing: 8,
        css: 'min-height: 400px;',
        children: [],
    });

    const imageGrid = Box({
        className: 'image-grid-container',
        vertical: true,
        vexpand: true,
        spacing: 8,
        children: [imageList],
    });

    const pdfList = Box({
        className: 'pdf-grid',
        vertical: true,
        spacing: 8,
        css: 'min-height: 400px;',
        children: [],
    });

    const pdfGrid = Box({
        className: 'pdf-grid-container',
        vertical: true,
        vexpand: true,
        spacing: 8,
        css: 'padding: 12px;',
        children: [pdfList],
    });

    const contentStack = Stack({
        transition: 'slide_up_down',
        transitionDuration: 200,
        css: 'min-width: 800px; height: 500px;',
        children: {
            'current': Box({
                vertical: true,
                children: [contentList],
            }),
            'done': Box({
                vertical: true,
                children: [doneList],
            }),
            'notes': Box({
                vertical: true,
                children: [noteList],
            }),
            'images': Box({
                vertical: true,
                vexpand: true,
                children: [imageGrid],
            }),
            'pdfs': Box({
                vertical: true,
                vexpand: true,
                children: [pdfGrid],
            }),
        },
        setup: stack => {
            stack.shown = 'current';
        },
    });

    const todoSubcategories = Box({
        vertical: true,
        className: 'sidebar-subcategories',
        children: [
            Button({
                className: 'category-button active',
                onClicked: function(button) {
                    contentStack.shown = 'current';
                    entryBox.get_children()[1].shown = 'current';
                    if (activeButton) activeButton.toggleClassName('active', false);
                    button.toggleClassName('active', true);
                    activeButton = button;
                },
                child: Box({
                    children: [
                        Label({
                            className: 'category-icon icon-material',
                            label: 'task_alt',
                        }),
                        Label({
                            label: 'Current',
                            css: 'margin-left: 4px; font-size: 14px; color: @onLayer1;',
                        }),
                    ],
                }),
            }),
            Button({
                className: 'category-button',
                onClicked: function(button) {
                    contentStack.shown = 'done';
                    entryBox.get_children()[1].shown = 'done';
                    if (activeButton) activeButton.toggleClassName('active', false);
                    button.toggleClassName('active', true);
                    activeButton = button;
                },
                child: Box({
                    children: [
                        Label({
                            className: 'category-icon icon-material',
                            label: 'done_all',
                        }),
                        Label({
                            label: 'Done',
                            css: 'margin-left: 4px; font-size: 14px; color: @onLayer1;',
                        }),
                    ],
                }),
            }),
        ],
    });

    let activeButton = null;

    const updateContent = () => {
        const todos = Todo.todo_json;
        const notes = Todo.notes_json;
        const images = Todo.images_json;
        const pdfs = Todo.pdfs_json;

        console.log('Updating content:', { 
            todos: todos.length, 
            notes: notes.length, 
            images: images.length, 
            pdfs: pdfs.length 
        });

        // Filter tasks and notes
        const activeTodos = todos.filter(todo => todo.type === 'todo' && !todo.done);
        const doneTodos = todos.filter(todo => todo.type === 'todo' && todo.done);
        const noteItems = notes.filter(note => note.type === 'note');
        
        // Map tasks to their respective lists
        contentList.children = activeTodos.map((todo, i) => {
            const id = todos.findIndex(t => t === todo);
            return TodoItem(todo, id);
        });
        
        doneList.children = doneTodos.map((todo, i) => {
            const id = todos.findIndex(t => t === todo);
            return TodoItem(todo, id);
        });
        
        noteList.children = noteItems.map((note, i) => {
            const id = notes.findIndex(n => n === note);
            return NoteItem(note, id);
        });

        // Create rows of 4 images
        const imageRows = [];
        for (let i = 0; i < images.length; i += 4) {
            const rowImages = images.slice(i, i + 4);
            const row = Box({
                className: 'image-row',
                spacing: 8,
                children: rowImages.map((image, idx) => ImageItem(image, i + idx)),
            });
            imageRows.push(row);
        }
        imageList.children = imageRows;
        console.log('Updated image grid with', images.length, 'images');

        // Create rows of 4 PDFs
        const pdfRows = [];
        for (let i = 0; i < pdfs.length; i += 4) {
            const rowPdfs = pdfs.slice(i, i + 4);
            const row = Box({
                className: 'pdf-row',
                spacing: 8,
                children: rowPdfs.map((pdf, idx) => PdfItem(pdf, i + idx)),
            });
            pdfRows.push(row);
        }
        pdfList.children = pdfRows;
        console.log('Updated PDF grid with', pdfs.length, 'PDFs');
    };

    // Connect to all relevant signals
    Todo.connect('changed', () => {
        console.log('Todo service changed');
        Utils.timeout(50, () => {
            updateContent();
        });
    });

    Todo.connect('notify::images_json', () => {
        console.log('Images updated');
        Utils.timeout(50, () => {
            updateContent();
        });
    });

    Todo.connect('notify::pdfs_json', () => {
        console.log('PDFs updated');
        Utils.timeout(50, () => {
            updateContent();
        });
    });

    // Load initial content
    Utils.timeout(50, () => {
        console.log('Loading initial content');
        updateContent();
    });

    const noteSubcategories = Box({
        vertical: true,
        className: 'sidebar-subcategories',
        children: [
            Button({
                className: 'category-button',
                onClicked: function(button) {
                    contentStack.shown = 'notes';
                    entryBox.get_children()[1].shown = 'notes';
                    if (activeButton) activeButton.toggleClassName('active', false);
                    button.toggleClassName('active', true);
                    activeButton = button;
                },
                child: Box({
                    children: [
                        Label({
                            className: 'category-icon icon-material',
                            label: 'note',
                        }),
                        Label({
                            className: 'category-label',
                            label: 'All Notes',
                        }),
                    ],
                }),
            }),
        ],
    });

    const imageSubcategories = Box({
        vertical: true,
        className: 'sidebar-subcategories',
        children: [
            Button({
                className: 'category-button',
                onClicked: function(button) {
                    contentStack.shown = 'images';
                    entryBox.get_children()[1].shown = 'images';
                    if (activeButton) activeButton.toggleClassName('active', false);
                    button.toggleClassName('active', true);
                    activeButton = button;
                },
                child: Box({
                    children: [
                        Label({
                            className: 'category-icon icon-material',
                            label: 'image',
                        }),
                        Label({
                            className: 'category-label',
                            label: 'All Images',
                        }),
                    ],
                }),
            }),
        ],
    });

    const pdfSubcategories = Box({
        vertical: true,
        className: 'sidebar-subcategories',
        children: [
            Button({
                className: 'category-button',
                onClicked: function(button) {
                    contentStack.shown = 'pdfs';
                    entryBox.get_children()[1].shown = 'pdfs';
                    if (activeButton) activeButton.toggleClassName('active', false);
                    button.toggleClassName('active', true);
                    activeButton = button;
                },
                child: Box({
                    children: [
                        Label({
                            className: 'category-icon icon-material',
                            label: 'picture_as_pdf',
                        }),
                        Label({
                            className: 'category-label',
                            label: 'All PDFs',
                        }),
                    ],
                }),
            }),
        ],
    });

    const todoCategories = CategoryButton('Tasks', 'task_alt', null, true);
    const noteCategories = CategoryButton('Notes', 'note', null);
    const imageCategories = CategoryButton('Images', 'image', null);
    const pdfCategories = CategoryButton('PDFs', 'picture_as_pdf', null);

    todoCategories.children[1].child = todoSubcategories;

    noteCategories.children[1].child = noteSubcategories;

    imageCategories.children[1].child = imageSubcategories;

    pdfCategories.children[1].child = pdfSubcategories;

    const categorySidebar = Box({
        className: 'category-sidebar',
        vertical: true,
        children: [
            todoCategories,
            noteCategories,
            imageCategories,
            pdfCategories,
        ],
    });

    const sidebarWidth = Variable(200);

    const sidebarContainer = Box({
        className: 'sidebar-container',
        children: [
            Box({
                className: 'category-sidebar',
                css: `min-width: ${sidebarWidth.value}px;`,
                child: categorySidebar,
            }),
            Button({
                className: 'resize-handle',
                cursor: 'col-resize',
                setup: self => {
                    let dragging = false;
                    
                    self.connect('button-press-event', () => {
                        dragging = true;
                        self.toggleClassName('dragging', true);
                        return true;
                    });
                    
                    self.connect('button-release-event', () => {
                        dragging = false;
                        self.toggleClassName('dragging', false);
                        return true;
                    });
                    
                    self.connect('motion-notify-event', (_, event) => {
                        if (dragging) {
                            const [x] = event.get_coords();
                            sidebarWidth.value = Math.max(150, Math.min(300, x));
                        }
                        return true;
                    });
                    
                    self.connect('enter-notify-event', () => {
                        if (!dragging) {
                            self.toggleClassName('hover', true);
                        }
                        return true;
                    });
                    
                    self.connect('leave-notify-event', () => {
                        if (!dragging) {
                            self.toggleClassName('hover', false);
                        }
                        return true;
                    });
                },
            }),
        ],
    });

    return Box({
        className: 'notes-container',
        child: Box({
            className: 'content-container',
            css: 'min-width: 800px;',
            children: [
                sidebarContainer,
                Box({
                    className: 'content-panel',
                    vertical: true,
                    children: [
                        Scrollable({
                            vexpand: true,
                            child: contentStack,
                        }),
                        entryBox,
                    ],
                }),
            ],
        }),
    });
};
