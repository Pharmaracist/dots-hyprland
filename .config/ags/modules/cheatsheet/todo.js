import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import Todo from '../../services/todo.js';
import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import GdkPixbuf from 'gi://GdkPixbuf';
import Gdk from 'gi://Gdk';
import Pango from 'gi://Pango';
import Gtk from 'gi://Gtk';

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
                className: 'txt-norm onSurfaceVariant',
                hexpand: true,
                xalign: 0,
                justification: 'left',
                wrap: true,
                wrapMode: Pango.WrapMode.WORD_CHAR,
                css: `margin-left: 8px;`,
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
                                        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px;',
                                        child: Label({
                                            className: 'icon-material onSurfaceVariant txt-norm',
                                            label: task.done ? 'radio_button_checked' : 'radio_button_unchecked',
                                            css: 'font-size: 16px;',
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
                                        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px;',
                                        child: Label({
                                            className: 'icon-material onSurfaceVariant txt-norm',
                                            label: 'delete',
                                            css: 'font-size: 16px;',
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
                className: 'txt-norm onSurfaceVariant',
                hexpand: true,
                xalign: 0,
                justification: 'left',
                wrap: true,
                wrapMode: Pango.WrapMode.WORD_CHAR,
                css: 'margin-left: 8px;',
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
            css: 'border-radius: 8px; padding: 4px; margin: 2px 0;',
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
                                            className: 'icon-material onSurfaceVariant txt-norm',
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
        className: 'image-item onSurfaceVariant',
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
    let pixbuf;
    try {
        if (pdf.thumbnail) {
            pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(
                pdf.thumbnail,
                200,  // width
                200,  // height
                true  // preserve aspect ratio
            );
        }
    } catch (e) {
        print(`Error loading PDF thumbnail: ${e}`);
    }

    return Box({
        className: 'pdf-item',
        vertical: true,
        spacing: 4,
        css: 'min-width: 200px; border-radius: 8px; margin: 4px;',
        children: [
            Button({
                className: 'pdf-container',
                onClicked: () => {
                    Utils.execAsync(['xdg-open', pdf.path]);
                    App.closeWindow('cheatsheet');
                },
                child: Widget.DrawingArea({
                    className: 'pdf-preview',
                    css: 'min-width: 200px; min-height: 200px; border-radius: 8px;',
                    setup: area => {
                        if (pixbuf) {
                            area.set_size_request(200, 200);
                            area.connect('draw', (widget, cr) => {
                                const scale = widget.get_scale_factor();
                                const width = widget.get_allocated_width();
                                const height = widget.get_allocated_height();

                                // Draw rounded corners
                                cr.arc(8, 8, 8, Math.PI, 1.5 * Math.PI);
                                cr.arc(width - 8, 8, 8, 1.5 * Math.PI, 2 * Math.PI);
                                cr.arc(width - 8, height - 8, 8, 0, 0.5 * Math.PI);
                                cr.arc(8, height - 8, 8, 0.5 * Math.PI, Math.PI);
                                cr.closePath();
                                cr.clip();

                                // Draw the thumbnail
                                Gtk.render_background(
                                    widget.get_style_context(),
                                    cr,
                                    0,
                                    0,
                                    width,
                                    height,
                                );

                                if (pixbuf) {
                                    cr.scale(width / pixbuf.get_width(), height / pixbuf.get_height());
                                    Gdk.cairo_set_source_pixbuf(cr, pixbuf, 0, 0);
                                    cr.paint();
                                }
                            });
                        } else {
                            // Fallback to PDF icon if no thumbnail
                            area.set_size_request(200, 200);
                            area.connect('draw', (widget, cr) => {
                                const width = widget.get_allocated_width();
                                const height = widget.get_allocated_height();

                                // Draw rounded corners
                                cr.arc(8, 8, 8, Math.PI, 1.5 * Math.PI);
                                cr.arc(width - 8, 8, 8, 1.5 * Math.PI, 2 * Math.PI);
                                cr.arc(width - 8, height - 8, 8, 0, 0.5 * Math.PI);
                                cr.arc(8, height - 8, 8, 0.5 * Math.PI, Math.PI);
                                cr.closePath();
                                cr.clip();

                                // Draw background
                                Gtk.render_background(
                                    widget.get_style_context(),
                                    cr,
                                    0,
                                    0,
                                    width,
                                    height,
                                );
                            });

                            return Box({
                                className: 'pdf-fallback',
                                children: [
                                    Label({
                                        className: 'icon-material onSurfaceVariant txt-norm',
                                        label: 'picture_as_pdf',
                                        css: 'font-size: 64px;',
                                    }),
                                ],
                            });
                        }
                    },
                }),
            }),
            Box({
                className: 'pdf-info',
                children: [
                    Button({
                        className: 'pdf-action-btn',
                        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px;',
                        onClicked: () => {
                            Todo.deletePdf(id);
                            updateContent();
                        },
                        child: Label({
                            className: 'icon-material onSurfaceVariant txt-norm',
                            label: 'delete',
                            css: 'font-size: 16px;',
                        }),
                    }),
                    Label({
                        label: pdf.name || 'Untitled PDF',
                        xalign: 0,
                        justification: 'left',
                        truncate: 'end',
                        maxWidthChars: 25,
                        className: 'onSurfaceVariant txt-norm',
                        css: 'margin-left: 4px; font-size: 14px;',
                    }),
                ],
            }),
        ],
    });
};

const VideoItem = (video, id) => {
    let pixbuf;
    try {
        if (video.thumbnail) {
            pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(
                video.thumbnail,
                200,  // width
                112,  // height
                true  // preserve aspect ratio
            );
        }
    } catch (e) {
        print(`Error loading video thumbnail: ${e}`);
    }

    return Box({
        className: 'video-item onSurfaceVariant',
        vertical: true,
        spacing: 4,
        children: [
            Button({
                className: 'video-container',
                onClicked: () => {
                    Utils.execAsync(['xdg-open', video.path]);
                    App.closeWindow('cheatsheet');
                },
                child: Widget.DrawingArea({
                    className: 'video-preview',
                    css: 'min-width: 200px; min-height: 112px; border-radius: 8px;',
                    setup: area => {
                        if (pixbuf) {
                            area.set_size_request(200, 112);
                            area.connect('draw', (widget, cr) => {
                                const scale = widget.get_scale_factor();
                                const width = widget.get_allocated_width();
                                const height = widget.get_allocated_height();

                                // Draw rounded corners
                                cr.arc(8, 8, 8, Math.PI, 1.5 * Math.PI);
                                cr.arc(width - 8, 8, 8, 1.5 * Math.PI, 2 * Math.PI);
                                cr.arc(width - 8, height - 8, 8, 0, 0.5 * Math.PI);
                                cr.arc(8, height - 8, 8, 0.5 * Math.PI, Math.PI);
                                cr.closePath();
                                cr.clip();

                                // Draw the thumbnail
                                Gtk.render_background(
                                    widget.get_style_context(),
                                    cr,
                                    0,
                                    0,
                                    width,
                                    height,
                                );

                                if (pixbuf) {
                                    cr.scale(width / pixbuf.get_width(), height / pixbuf.get_height());
                                    Gdk.cairo_set_source_pixbuf(cr, pixbuf, 0, 0);
                                    cr.paint();
                                }
                            });
                        } else {
                            // Fallback to play icon if no thumbnail
                            area.set_size_request(200, 112);
                            area.connect('draw', (widget, cr) => {
                                const width = widget.get_allocated_width();
                                const height = widget.get_allocated_height();

                                // Draw rounded corners
                                cr.arc(8, 8, 8, Math.PI, 1.5 * Math.PI);
                                cr.arc(width - 8, 8, 8, 1.5 * Math.PI, 2 * Math.PI);
                                cr.arc(width - 8, height - 8, 8, 0, 0.5 * Math.PI);
                                cr.arc(8, height - 8, 8, 0.5 * Math.PI, Math.PI);
                                cr.closePath();
                                cr.clip();

                                // Draw background
                                Gtk.render_background(
                                    widget.get_style_context(),
                                    cr,
                                    0,
                                    0,
                                    width,
                                    height,
                                );
                            });

                            return Box({
                                className: 'video-fallback',
                                children: [
                                    Label({
                                        className: 'icon-material onSurfaceVariant txt-norm',
                                        label: 'play_circle',
                                        css: 'font-size: 48px;',
                                    }),
                                ],
                            });
                        }
                    },
                }),
            }),
            Box({
                className: 'video-info',
                children: [
                    Button({
                        className: 'video-action-btn',
                        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px;',
                        onClicked: () => {
                            Todo.deleteVideo(id);
                            updateContent();
                        },
                        child: Label({
                            className: 'icon-material onSurfaceVariant txt-norm',
                            label: 'delete',
                            css: 'font-size: 16px;',
                        }),
                    }),
                    Label({
                        label: video.name || 'Untitled Video',
                        xalign: 0,
                        justification: 'left',
                        truncate: 'end',
                        maxWidthChars: 25,
                        className: 'onSurfaceVariant txt-norm',
                        css: 'margin-left: 4px; font-size: 14px;',
                    }),
                ],
            }),
        ],
    });
};

const MusicItem = (music, id) => {
    let pixbuf;
    try {
        if (music.thumbnail) {
            pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(
                music.thumbnail,
                200,  // width
                112,  // height
                true  // preserve aspect ratio
            );
        }
    } catch (e) {
        print(`Error loading music thumbnail: ${e}`);
    }

    return Box({
        className: 'music-item onSurfaceVariant',
        vertical: true,
        spacing: 4,
        children: [
            Button({
                className: 'music-container',
                onClicked: () => {
                    Utils.execAsync(['xdg-open', music.path]);
                    App.closeWindow('cheatsheet');
                },
                child: Widget.DrawingArea({
                    className: 'music-preview',
                    css: 'min-width: 200px; min-height: 112px; border-radius: 8px;',
                    setup: area => {
                        if (pixbuf) {
                            area.set_size_request(200, 112);
                            area.connect('draw', (widget, cr) => {
                                const scale = widget.get_scale_factor();
                                const width = widget.get_allocated_width();
                                const height = widget.get_allocated_height();

                                // Draw rounded corners
                                cr.arc(8, 8, 8, Math.PI, 1.5 * Math.PI);
                                cr.arc(width - 8, 8, 8, 1.5 * Math.PI, 2 * Math.PI);
                                cr.arc(width - 8, height - 8, 8, 0, 0.5 * Math.PI);
                                cr.arc(8, height - 8, 8, 0.5 * Math.PI, Math.PI);
                                cr.closePath();
                                cr.clip();

                                // Draw the thumbnail
                                Gtk.render_background(
                                    widget.get_style_context(),
                                    cr,
                                    0,
                                    0,
                                    width,
                                    height,
                                );

                                if (pixbuf) {
                                    cr.scale(width / pixbuf.get_width(), height / pixbuf.get_height());
                                    Gdk.cairo_set_source_pixbuf(cr, pixbuf, 0, 0);
                                    cr.paint();
                                }
                            });
                        } else {
                            // Fallback to play icon if no thumbnail
                            area.set_size_request(200, 112);
                            area.connect('draw', (widget, cr) => {
                                const width = widget.get_allocated_width();
                                const height = widget.get_allocated_height();

                                // Draw rounded corners
                                cr.arc(8, 8, 8, Math.PI, 1.5 * Math.PI);
                                cr.arc(width - 8, 8, 8, 1.5 * Math.PI, 2 * Math.PI);
                                cr.arc(width - 8, height - 8, 8, 0, 0.5 * Math.PI);
                                cr.arc(8, height - 8, 8, 0.5 * Math.PI, Math.PI);
                                cr.closePath();
                                cr.clip();

                                // Draw background
                                Gtk.render_background(
                                    widget.get_style_context(),
                                    cr,
                                    0,
                                    0,
                                    width,
                                    height,
                                );
                            });

                            return Box({
                                className: 'music-fallback',
                                children: [
                                    Label({
                                        className: 'icon-material onSurfaceVariant txt-norm',
                                        label: 'music_note',
                                        css: 'font-size: 48px;',
                                    }),
                                ],
                            });
                        }
                    },
                }),
            }),
            Box({
                className: 'music-info',
                children: [
                    Button({
                        className: 'music-action-btn',
                        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px;',
                        onClicked: () => {
                            Todo.deleteMusic(id);
                            updateContent();
                        },
                        child: Label({
                            className: 'icon-material onSurfaceVariant txt-norm',
                            label: 'delete',
                            css: 'font-size: 16px;',
                        }),
                    }),
                    Label({
                        label: music.name || 'Untitled Music',
                        xalign: 0,
                        justification: 'left',
                        truncate: 'end',
                        maxWidthChars: 25,
                        className: 'onSurfaceVariant txt-norm',
                        css: 'margin-left: 4px; font-size: 14px;',
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
                    className: 'category-icon icon-material onSurfaceVariant txt-norm',
                    label: expanded ? 'expand_more' : 'chevron_right',
                }),
                Label({
                    className: 'category-icon icon-material onSurfaceVariant txt-norm',
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
    const todoEntry = Entry({
        className: 'content-entry',
        hexpand: true,
        hpack:'center',
        placeholderText: 'New Todo',
        onAccept: ({ text }) => {
            if (text.length > 0) {
                Todo.addTodo(text);
                todoEntry.text = '';
            }
        },
    });

    const noteEntry = Entry({
        className: 'content-entry',
        hexpand: true,
        hpack:'center',
        placeholderText: 'New Note',
        onAccept: ({ text }) => {
            if (text.length > 0) {
                Todo.addNote(text);
                noteEntry.text = '';
            }
        },
    });

    const todoAddButton = Button({
        className: 'add-button',
        css: 'padding: 0.8rem; border-radius: 25px',
        child: Box({
            children: [
                Label({
                    className: 'icon-material txt-large',
                    label: 'add',
                }),
            ],
        }),
        onClicked: () => {
            const text = todoEntry.text.trim();
            if (text) {
                Todo.addTodo(text);
                todoEntry.text = '';
                updateContent();
            }
        },
    });

    const noteAddButton = Button({
        className: 'add-button',
        css: 'padding: 0.8rem; border-radius: 25px',
        child: Box({
            children: [
                Label({
                    className: 'icon-material txt-large',
                    label: 'add',
                }),
            ],
        }),
        onClicked: () => {
            const text = noteEntry.text.trim();
            if (text) {
                Todo.addNote(text);
                noteEntry.text = '';
                updateContent();
            }
        },
    });

    const imageAddButton = Button({
        className: 'add-button',
        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px;',
        child: Label({
            className: 'icon-material',
            label: 'add',
        }),
        onClicked: () => {
            const defaultPath = GLib.build_filenamev([GLib.get_home_dir(), 'ags', 'Dashboard', 'images']);
            Utils.execAsync(['zenity', '--file-selection', '--title=Select Image', '--file-filter=Images | *.png *.jpg *.jpeg *.gif *.webp', `--filename=${defaultPath}/`])
                .then(path => {
                    if (path) {
                        path = path.trim();
                        if (Todo.addImage(path)) {
                            Todo.notify('images_json');
                            updateContent();
                        }
                    }
                })
                .catch(error => {
                    console.error('Error selecting image:', error);
                });
        },
    });

    const imageRefreshButton = Button({
        className: 'refresh-button',
        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px;',
        child: Label({
            className: 'icon-material',
            label: 'refresh',
        }),
        onClicked: () => Todo.rescan(),
    });

    const pdfAddButton = Button({
        className: 'add-button',
        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px;',
        child: Label({
            className: 'icon-material',
            label: 'add',
        }),
        onClicked: () => {
            const defaultPath = GLib.build_filenamev([GLib.get_home_dir(), 'ags', 'Dashboard', 'pdf']);
            Utils.execAsync(['zenity', '--file-selection', '--title=Select PDF', '--file-filter=PDF Files | *.pdf', `--filename=${defaultPath}/`])
                .then(async path => {
                    if (path) {
                        path = path.trim();
                        const id = await Todo.addPdf(path);
                        if (id >= 0) {
                            updateContent();
                        }
                    }
                })
                .catch(error => {
                    console.error('Error selecting PDF:', error);
                });
        },
    });

    const pdfRefreshButton = Button({
        className: 'refresh-button',
        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px;',
        child: Label({
            className: 'icon-material',
            label: 'refresh',
        }),
        onClicked: () => Todo.rescan(),
    });

    const videoAddButton = Button({
        className: 'add-button',
        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px;',
        child: Label({
            className: 'icon-material onSurfaceVariant txt-norm',
            label: 'add',
            css: 'font-size: 16px;',
        }),
        onClicked: () => {
            const defaultPath = GLib.build_filenamev([GLib.get_home_dir(), 'ags', 'Dashboard', 'videos']);
            Utils.execAsync(['zenity', '--file-selection', '--title=Select Video', '--file-filter=Video Files | *.mp4 *.mkv *.webm *.avi *.mov', `--filename=${defaultPath}/`])
                .then(path => {
                    if (path) {
                        path = path.trim();
                        if (Todo.addVideo(path)) {
                            Todo.notify('videos_json');
                            updateContent();
                        }
                    }
                })
                .catch(error => {
                    console.error('Error selecting video:', error);
                });
        },
    });

    const videoRefreshButton = Button({
        className: 'refresh-button',
        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px;',
        child: Label({
            className: 'icon-material',
            label: 'refresh',
        }),
        onClicked: () => Todo.rescan(),
    });

    const musicAddButton = Button({
        className: 'add-button',
        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px;',
        child: Label({
            className: 'icon-material',
            label: 'add',
        }),
        onClicked: () => {
            const defaultPath = GLib.build_filenamev([GLib.get_home_dir(), 'ags', 'Dashboard', 'music']);
            Utils.execAsync(['zenity', '--file-selection', '--title=Select Music File', '--filename=' + defaultPath + '/', '--file-filter=*.mp3 *.m4a *.ogg *.flac *.wav'])
                .then(path => {
                    if (path) {
                        Todo.addMusic?.(path.trim());
                    }
                })
                .catch(print);
        },
    });

    const musicRefreshButton = Button({
        className: 'refresh-button',
        css: 'min-width: 24px; min-height: 24px; padding: 4px; border-radius: 12px;',
        child: Label({
            className: 'icon-material',
            label: 'refresh',
        }),
        onClicked: () => Todo.rescan(),
    });

    const musicControls = Box({
        className: 'music-controls',
        spacing: 8,
        children: [
            Button({
                className: 'music-control-button',
                css: 'min-width: 32px; min-height: 32px; padding: 4px; border-radius: 16px;',
                child: Label({
                    className: 'icon-material',
                    label: 'skip_previous',
                }),
                onClicked: () => {
                    const player = Mpris.getPlayer();
                    if (player) player.previous();
                },
            }),
            Button({
                className: 'music-control-button',
                css: 'min-width: 32px; min-height: 32px; padding: 4px; border-radius: 16px;',
                child: Label({
                    className: 'icon-material',
                    label: 'play_arrow',
                }),
                onClicked: () => {
                    const player = Mpris.getPlayer();
                    if (player) player.playPause();
                },
            }),
            Button({
                className: 'music-control-button',
                css: 'min-width: 32px; min-height: 32px; padding: 4px; border-radius: 16px;',
                child: Label({
                    className: 'icon-material',
                    label: 'skip_next',
                }),
                onClicked: () => {
                    const player = Mpris.getPlayer();
                    if (player) player.next();
                },
            }),
        ],
    });

    const entryBox = Box({
        className: 'entry-box',
        spacing: 8,
        children: [
            Stack({
                transition: 'slide_left_right',
                items: [
                    ['todo', Box({
                        className: 'entry-box-content',
                        children: [todoEntry, todoAddButton],
                    })],
                    ['notes', Box({
                        className: 'entry-box-content',
                        children: [noteEntry, noteAddButton],
                    })],
                    ['images', Box({
                        className: 'entry-box-content',
                        spacing: 4,
                        children: [imageAddButton, imageRefreshButton],
                    })],
                    ['pdfs', Box({
                        className: 'entry-box-content',
                        spacing: 4,
                        children: [pdfAddButton, pdfRefreshButton],
                    })],
                    ['videos', Box({
                        className: 'entry-box-content',
                        spacing: 8,
                        children: [
                            Box({
                                className: 'media-controls',
                                spacing: 4,
                                children: [
                                    Button({
                                        className: 'media-control-button',
                                        css: 'min-width: 32px; min-height: 32px; padding: 4px; border-radius: 16px;',
                                        child: Label({
                                            className: 'icon-material',
                                            label: 'skip_previous',
                                        }),
                                        onClicked: () => {
                                            const player = Mpris.getPlayer();
                                            if (player) player.previous();
                                        },
                                    }),
                                    Button({
                                        className: 'media-control-button',
                                        css: 'min-width: 32px; min-height: 32px; padding: 4px; border-radius: 16px;',
                                        child: Label({
                                            className: 'icon-material',
                                            label: 'play_arrow',
                                        }),
                                        onClicked: () => {
                                            const player = Mpris.getPlayer();
                                            if (player) player.playPause();
                                        },
                                    }),
                                    Button({
                                        className: 'media-control-button',
                                        css: 'min-width: 32px; min-height: 32px; padding: 4px; border-radius: 16px;',
                                        child: Label({
                                            className: 'icon-material',
                                            label: 'skip_next',
                                        }),
                                        onClicked: () => {
                                            const player = Mpris.getPlayer();
                                            if (player) player.next();
                                        },
                                    }),
                                ],
                            }),
                            Box({
                                className: 'media-actions',
                                spacing: 4,
                                children: [videoAddButton, videoRefreshButton],
                            }),
                        ],
                    })],
                    ['music', Box({
                        className: 'entry-box-content',
                        spacing: 8,
                        children: [
                            Box({
                                className: 'media-controls',
                                spacing: 4,
                                children: [
                                    Button({
                                        className: 'media-control-button',
                                        css: 'min-width: 32px; min-height: 32px; padding: 4px; border-radius: 16px;',
                                        child: Label({
                                            className: 'icon-material',
                                            label: 'skip_previous',
                                        }),
                                        onClicked: () => {
                                            const player = Mpris.getPlayer();
                                            if (player) player.previous();
                                        },
                                    }),
                                    Button({
                                        className: 'media-control-button',
                                        css: 'min-width: 32px; min-height: 32px; padding: 4px; border-radius: 16px;',
                                        child: Label({
                                            className: 'icon-material',
                                            label: 'play_arrow',
                                        }),
                                        onClicked: () => {
                                            const player = Mpris.getPlayer();
                                            if (player) player.playPause();
                                        },
                                    }),
                                    Button({
                                        className: 'media-control-button',
                                        css: 'min-width: 32px; min-height: 32px; padding: 4px; border-radius: 16px;',
                                        child: Label({
                                            className: 'icon-material',
                                            label: 'skip_next',
                                        }),
                                        onClicked: () => {
                                            const player = Mpris.getPlayer();
                                            if (player) player.next();
                                        },
                                    }),
                                ],
                            }),
                            Box({
                                className: 'media-actions',
                                spacing: 4,
                                children: [musicAddButton, musicRefreshButton],
                            }),
                        ],
                    })],
                ],
                setup: self => {
                    self.shown = 'todo';
                },
            }),
        ],
    });

    const contentList = Box({
        className: 'content-list',
        vertical: true,
        spacing: 8,
        css: 'padding: 8px;',
    });

    const doneList = Box({
        className: 'done-list',
        vertical: true,
        spacing: 8,
        css: 'padding: 8px;',
    });

    const noteList = Box({
        className: 'note-list',
        vertical: true,
        spacing: 8,
        css: 'padding: 8px;',
    });

    const imageList = Box({
        className: 'image-grid',
        vertical: true,
        spacing: 8,
        css: 'min-height: 400px;',
    });

    const imageGrid = Box({
        className: 'image-grid-container',
        vertical: true,
        vexpand: true,
        spacing: 8,
        css: 'padding: 12px;',
        children: [imageList],
    });

    const pdfList = Box({
        className: 'pdf-grid',
        vertical: true,
        spacing: 8,
        css: 'min-height: 400px;',
    });

    const pdfGrid = Box({
        className: 'pdf-grid-container',
        vertical: true,
        vexpand: true,
        spacing: 8,
        css: 'padding: 12px;',
        children: [pdfList],
    });

    const videoList = Box({
        className: 'video-grid',
        vertical: true,
        spacing: 8,
        css: 'min-height: 400px;',
    });

    const videoGrid = Box({
        className: 'video-grid-container',
        vertical: true,
        vexpand: true,
        spacing: 8,
        css: 'padding: 12px;',
        children: [videoList],
    });

    const musicList = Box({
        className: 'music-grid',
        vertical: true,
        spacing: 8,
        css: 'min-height: 400px;',
    });

    const musicGrid = Box({
        className: 'music-grid-container',
        vertical: true,
        vexpand: true,
        spacing: 8,
        css: 'padding: 12px;',
        children: [musicList],
    });

    const contentStack = Stack({
        transition: 'slide_up_down',
        transitionDuration: 200,
        items: [
            ['current', Box({
                vertical: true,
                vexpand: true,
                children: [contentList],
            })],
            ['done', Box({
                vertical: true,
                vexpand: true,
                children: [doneList],
            })],
            ['notes', Box({
                vertical: true,
                vexpand: true,
                children: [noteList],
            })],
            ['images', Box({
                vertical: true,
                vexpand: true,
                children: [imageGrid],
            })],
            ['pdfs', Box({
                vertical: true,
                vexpand: true,
                children: [pdfGrid],
            })],
            ['videos', Box({
                vertical: true,
                vexpand: true,
                children: [videoGrid],
            })],
            ['music', Box({
                vertical: true,
                vexpand: true,
                children: [
                    musicControls,
                    musicGrid,
                ],
            })],
        ],
        setup: stack => {
            stack.shown = 'current';
            stack.connect('notify::shown', () => {
                const name = stack.shown;
                if (name === 'current') {
                    todoEntry.placeholderText = 'New Todo';
                } else if (name === 'done') {
                    todoEntry.placeholderText = 'New Todo';
                } else if (name === 'notes') {
                    noteEntry.placeholderText = 'New Note';
                } else if (name === 'images') {
                    todoEntry.placeholderText = 'Select Image';
                } else if (name === 'pdfs') {
                    todoEntry.placeholderText = 'Select PDF';
                } else if (name === 'videos') {
                    todoEntry.placeholderText = 'Select Video';
                } else if (name === 'music') {
                    todoEntry.placeholderText = 'Select Music File';
                }
            });
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
                    entryBox.get_children()[0].shown = 'todo';
                    if (activeButton) activeButton.toggleClassName('active', false);
                    button.toggleClassName('active', true);
                    activeButton = button;
                },
                child: Box({
                    children: [
                        Label({
                            className: 'category-icon icon-material onSurfaceVariant txt-norm',
                            label: 'task_alt',
                        }),
                        Label({
                            label: 'Current',
                            className: 'onSurfaceVariant txt-norm',
                            css: 'margin-left: 4px; font-size: 14px;',
                        }),
                    ],
                }),
            }),
            Button({
                className: 'category-button',
                onClicked: function(button) {
                    contentStack.shown = 'done';
                    entryBox.get_children()[0].shown = 'done';
                    if (activeButton) activeButton.toggleClassName('active', false);
                    button.toggleClassName('active', true);
                    activeButton = button;
                },
                child: Box({
                    children: [
                        Label({
                            className: 'category-icon icon-material onSurfaceVariant txt-norm',
                            label: 'done_all',
                        }),
                        Label({
                            label: 'Done',
                            className: 'onSurfaceVariant txt-norm',
                            css: 'margin-left: 4px; font-size: 14px;',
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
        const videos = Todo.videos_json;
        const music = Todo.music_json;

        // Filter tasks and notes
        const currentTodos = todos.filter(todo => !todo.done);
        const doneTodos = todos.filter(todo => todo.done);

        // Update current tasks
        contentList.children = currentTodos.map((todo, id) => TodoItem(todo, id));

        // Update done tasks
        doneList.children = doneTodos.map((todo, id) => TodoItem(todo, id));

        // Update notes
        noteList.children = notes.map((note, id) => NoteItem(note, id));

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

        // Create rows of 4 Videos
        const videoRows = [];
        for (let i = 0; i < videos.length; i += 4) {
            const rowVideos = videos.slice(i, i + 4);
            const row = Box({
                className: 'video-row',
                spacing: 8,
                children: rowVideos.map((video, idx) => VideoItem(video, i + idx)),
            });
            videoRows.push(row);
        }
        videoList.children = videoRows;

        // Create rows of 4 Music
        const musicRows = [];
        for (let i = 0; i < music.length; i += 4) {
            const rowMusic = music.slice(i, i + 4);
            const row = Box({
                className: 'music-row',
                spacing: 8,
                children: rowMusic.map((music, idx) => MusicItem(music, i + idx)),
            });
            musicRows.push(row);
        }
        musicList.children = musicRows;
    };

    // Connect to all relevant signals
    Todo.connect('changed', () => {
        Utils.timeout(10, () => {
            updateContent();
        });
    });

    Todo.connect('notify::images_json', () => {
        Utils.timeout(10, () => {
            updateContent();
        });
    });

    Todo.connect('notify::pdfs_json', () => {
        Utils.timeout(10, () => {
            updateContent();
        });
    });

    Todo.connect('notify::videos_json', () => {
        Utils.timeout(10, () => {
            updateContent();
        });
    });

    Todo.connect('notify::music_json', () => {
        Utils.timeout(10, () => {
            updateContent();
        });
    });

    // Load initial content
    Utils.timeout(10, () => {
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
                    entryBox.children[0].shown = 'notes';
                    if (activeButton) activeButton.toggleClassName('active', false);
                    button.toggleClassName('active', true);
                    activeButton = button;
                },
                child: Box({
                    children: [
                        Label({
                            className: 'category-icon icon-material onSurfaceVariant txt-norm',
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
                    entryBox.children[0].shown = 'images';
                    if (activeButton) activeButton.toggleClassName('active', false);
                    button.toggleClassName('active', true);
                    activeButton = button;
                },
                child: Box({
                    children: [
                        Label({
                            className: 'category-icon icon-material onSurfaceVariant txt-norm',
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
                    entryBox.children[0].shown = 'pdfs';
                    if (activeButton) activeButton.toggleClassName('active', false);
                    button.toggleClassName('active', true);
                    activeButton = button;
                },
                child: Box({
                    children: [
                        Label({
                            className: 'category-icon icon-material onSurfaceVariant txt-norm',
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

    const videoSubcategories = Box({
        vertical: true,
        className: 'sidebar-subcategories',
        children: [
            Button({
                className: 'category-button',
                onClicked: function(button) {
                    contentStack.shown = 'videos';
                    entryBox.children[0].shown = 'videos';
                    if (activeButton) activeButton.toggleClassName('active', false);
                    button.toggleClassName('active', true);
                    activeButton = button;
                },
                child: Box({
                    children: [
                        Label({
                            className: 'category-icon icon-material onSurfaceVariant txt-norm',
                            label: 'video_library',
                        }),
                        Label({
                            className: 'category-label',
                            label: 'All Videos',
                        }),
                    ],
                }),
            }),
        ],
    });

    const musicSubcategories = Box({
        vertical: true,
        className: 'sidebar-subcategories',
        children: [
            Button({
                className: 'category-button',
                onClicked: function(button) {
                    contentStack.shown = 'music';
                    entryBox.children[0].shown = 'music';
                    if (activeButton) activeButton.toggleClassName('active', false);
                    button.toggleClassName('active', true);
                    activeButton = button;
                },
                child: Box({
                    children: [
                        Label({
                            className: 'category-icon icon-material onSurfaceVariant txt-norm',
                            label: 'library_music',
                        }),
                        Label({
                            className: 'category-label',
                            label: 'All Music',
                        }),
                    ],
                }),
            }),
        ],
    });

    const todoButton = Button({
        child: Box({
            children: [
                Label({
                    className: 'icon-material',
                    label: 'task_alt',
                }),
                Label({
                    label: 'Tasks',
                }),
            ],
        }),
        className: 'category-button active',
        onClicked: function(button) {
            contentStack.shown = 'current';
            entryBox.children[0].shown = 'todo';
            if (activeButton) activeButton.toggleClassName('active', false);
            button.toggleClassName('active', true);
            activeButton = button;
            updateContent();
        },
    });

    const notesButton = Button({
        child: Box({
            children: [
                Label({
                    className: 'icon-material',
                    label: 'description',
                }),
                Label({
                    label: 'Notes',
                }),
            ],
        }),
        className: 'category-button',
        onClicked: function(button) {
            contentStack.shown = 'notes';
            entryBox.children[0].shown = 'notes';
            if (activeButton) activeButton.toggleClassName('active', false);
            button.toggleClassName('active', true);
            activeButton = button;
            updateContent();
        },
    });

    const imagesButton = Button({
        child: Box({
            children: [
                Label({
                    className: 'icon-material',
                    label: 'image',
                }),
                Label({
                    label: 'Images',
                }),
            ],
        }),
        className: 'category-button',
        onClicked: function(button) {
            contentStack.shown = 'images';
            entryBox.children[0].shown = 'images';
            if (activeButton) activeButton.toggleClassName('active', false);
            button.toggleClassName('active', true);
            activeButton = button;
            updateContent();
        },
    });

    const pdfsButton = Button({
        child: Box({
            children: [
                Label({
                    className: 'icon-material',
                    label: 'picture_as_pdf',
                }),
                Label({
                    label: 'PDFs',
                }),
            ],
        }),
        className: 'category-button',
        onClicked: function(button) {
            contentStack.shown = 'pdfs';
            entryBox.children[0].shown = 'pdfs';
            if (activeButton) activeButton.toggleClassName('active', false);
            button.toggleClassName('active', true);
            activeButton = button;
            updateContent();
        },
    });

    const videosButton = Button({
        child: Box({
            children: [
                Label({
                    className: 'icon-material',
                    label: 'movie',
                }),
                Label({
                    label: 'Videos',
                }),
            ],
        }),
        className: 'category-button',
        onClicked: function(button) {
            contentStack.shown = 'videos';
            entryBox.children[0].shown = 'videos';
            if (activeButton) activeButton.toggleClassName('active', false);
            button.toggleClassName('active', true);
            activeButton = button;
            updateContent();
        },
    });

    const musicButton = Button({
        child: Box({
            children: [
                Label({
                    className: 'icon-material',
                    label: 'library_music',
                }),
                Label({
                    label: 'Music',
                }),
            ],
        }),
        className: 'category-button',
        onClicked: function(button) {
            contentStack.shown = 'music';
            entryBox.children[0].shown = 'music';
            if (activeButton) activeButton.toggleClassName('active', false);
            button.toggleClassName('active', true);
            activeButton = button;
            updateContent();
        },
    });

    const todoCategories = CategoryButton('Tasks', 'task_alt', null, true);
    const noteCategories = CategoryButton('Notes', 'note', null);
    const imageCategories = CategoryButton('Images', 'image', null);
    const pdfCategories = CategoryButton('PDFs', 'picture_as_pdf', null);
    const videoCategories = CategoryButton('Videos', 'video_library', null);
    const musicCategories = CategoryButton('Music', 'library_music', null);

    todoCategories.children[1].child = todoSubcategories;

    noteCategories.children[1].child = noteSubcategories;

    imageCategories.children[1].child = imageSubcategories;

    pdfCategories.children[1].child = pdfSubcategories;

    videoCategories.children[1].child = videoSubcategories;

    musicCategories.children[1].child = musicSubcategories;

    const toggleIcon = Label({
        className: 'icon-material txt-large',
        label: 'toggle_on',
    });

    const sidebarWidth = Variable(200);
    const sidebarRevealer = Revealer({
        revealChild: true,
        transition: 'slide_right',
        transitionDuration: 200,
        child: Box({
            className: 'category-sidebar',
            css: `min-width: ${sidebarWidth.value}px;`,
            child: Box({
                className: 'category-sidebar',
                vertical: true,
                children: [
                    todoCategories,
                    noteCategories,
                    imageCategories,
                    pdfCategories,
                    videoCategories,
                    musicCategories,
                ],
            }),
        }),
        setup: self => {
            self.connect('notify::reveal-child', () => {
                toggleIcon.label = self.revealChild ? 'toggle_on' : 'toggle_off';
            });
        },
    });

    const sidebarContainer = Box({
        className: 'sidebar-container',
        children: [
            sidebarRevealer,
            Box({
                className: 'sidebar-controls',
                vpack: 'end',
                children: [
                    Button({
                        className: 'add-button',
                        css: 'padding: 0.8rem; border-radius: 25px',
                        child: toggleIcon,
                        onClicked: () => {
                            sidebarRevealer.revealChild = !sidebarRevealer.revealChild;
                        },
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
