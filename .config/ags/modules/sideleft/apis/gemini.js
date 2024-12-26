const { Gtk, Pango, Gdk } = imports.gi;
import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { fileExists } from '../../.miscutils/files.js';
import GLib from 'gi://GLib';

const { Box, Button, Icon, Label, Revealer, Scrollable } = Widget;
import GeminiService, { CHAT_MODELS } from '../../../services/gemini.js';
import { setupCursorHover, setupCursorHoverInfo } from '../../.widgetutils/cursorhover.js';
import { SystemMessage, ChatMessage } from "./ai_chatmessage.js";
import { ConfigToggle, ConfigSegmentedSelection, ConfigGap } from '../../.commonwidgets/configwidgets.js';
import { markdownTest } from '../../.miscutils/md2pango.js';
import { MarginRevealer } from '../../.widgethacks/advancedrevealers.js';
import { chatEntry } from '../apiwidgets.js';
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';

const MODEL_NAME = `Gemini`;

export const geminiTabIcon = Icon({
    hpack: 'center',
    icon: `google-gemini-symbolic`,
})

const GeminiInfo = () => {
    const geminiLogo = Icon({
        hpack: 'center',
        className: 'sidebar-chat-welcome-logo',
        icon: `google-gemini-symbolic`,
    });
    return Box({
        vertical: true,
        className: 'spacing-v-15',
        children: [
            geminiLogo,
            Label({
                className: 'txt txt-title-small sidebar-chat-welcome-txt',
                wrap: true,
                justify: Gtk.Justification.CENTER,
                label: `Assistant (Gemini)`,
            }),
            Box({
                className: 'spacing-h-5',
                hpack: 'center',
                children: [
                    Label({
                        className: 'txt-smallie txt-subtext',
                        wrap: true,
                        justify: Gtk.Justification.CENTER,
                        label: getString('Powered by Google'),
                    }),
                    Button({
                        className: 'txt-subtext txt-norm icon-material',
                        label: 'info',
                        tooltipText: getString("Uses gemini-pro.\nNot affiliated, endorsed, or sponsored by Google.\n\nPrivacy: Chat messages aren't linked to your account,\n    but will be read by human reviewers to improve the model."),
                        setup: setupCursorHoverInfo,
                    }),
                ]
            }),
        ]
    });
}

export const GeminiSettings = () => {
    const customPromptButton = Button({
        className: 'txt-small txt-action-button',
        label: 'Set Custom Prompt',
        onClicked: () => {
            const currentPrompt = GeminiService.getCustomPrompt();
            const entry = Widget.Entry({
                text: currentPrompt,
                placeholder_text: 'Enter additional instructions for the AI...',
                className: 'custom-prompt-entry',
            });
            dialog.present();
        },
    });

    return MarginRevealer({
        transition: 'slide_down',
        revealChild: true,
        extraSetup: (self) => self
            .hook(GeminiService, (self) => Utils.timeout(200, () => {
                self.attribute.hide();
            }), 'newMsg')
            .hook(GeminiService, (self) => Utils.timeout(200, () => {
                self.attribute.show();
            }), 'clear')
        ,
        child: Box({
            vertical: true,
            className: 'sidebar-chat-settings',
            children: [
                ConfigSegmentedSelection({
                    hpack: 'center',
                    icon: 'casino',
                    name: 'Randomness',
                    desc: getString("Gemini's temperature value.\n  Precise = 0\n  Balanced = 0.5\n  Creative = 1"),
                    options: [
                        { value: 0.00, name: getString('Precise'), },
                        { value: 0.50, name: getString('Balanced'), },
                        { value: 1.00, name: getString('Creative'), },
                    ],
                    initIndex: 2,
                    onChange: (value, name) => {
                        GeminiService.temperature = value;
                    },
                }),
                ConfigGap({ vertical: true, size: 10 }), // Note: size can only be 5, 10, or 15
                Box({
                    vertical: true,
                    hpack: 'fill',
                    className: 'sidebar-chat-settings-toggles',
                    children: [
                        ConfigToggle({
                            icon: 'model_training',
                            name: getString('Enhancements'),
                            desc: getString("Tells Gemini:\n- It's a Linux sidebar assistant\n- Be brief and use bullet points"),
                            initValue: GeminiService.assistantPrompt,
                            onChange: (self, newValue) => {
                                GeminiService.assistantPrompt = newValue;
                            },
                        }),
                        ConfigToggle({
                            icon: 'shield',
                            name: getString('Safety'),
                            desc: getString("When turned off, tells the API (not the model) \nto not block harmful/explicit content"),
                            initValue: GeminiService.safe,
                            onChange: (self, newValue) => {
                                GeminiService.safe = newValue;
                            },
                        }),
                        ConfigToggle({
                            icon: 'history',
                            name: getString('History'),
                            desc: getString("Saves chat history\nMessages in previous chats won't show automatically, but they are there"),
                            initValue: GeminiService.useHistory,
                            onChange: (self, newValue) => {
                                GeminiService.useHistory = newValue;
                            },
                        }),
                    ]
                })
            ]
        })
    });
};

export const GoogleAiInstructions = () => Box({
    homogeneous: true,
    children: [Revealer({
        transition: 'slide_down',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        setup: (self) => self
            .hook(GeminiService, (self, hasKey) => {
                self.revealChild = (GeminiService.key.length == 0);
            }, 'hasKey')
        ,
        child: Button({
            child: Label({
                useMarkup: true,
                wrap: true,
                className: 'txt sidebar-chat-welcome-txt',
                justify: Gtk.Justification.CENTER,
                wrapMode: Pango.WrapMode.WORD_CHAR,
                label: 'A Google AI API key is required\nYou can grab one <u>here</u>, then enter it below',
                // setup: self => self.set_markup("This is a <a href=\"https://www.github.com\">test link</a>")
            }),
            setup: setupCursorHover,
            onClicked: () => {
                Utils.execAsync(['bash', '-c', `xdg-open https://makersuite.google.com/app/apikey &`]);
            }
        })
    })]
});

const geminiWelcome = Box({
    vexpand: true,
    homogeneous: true,
    child: Box({
        className: 'spacing-v-15',
        vpack: 'center',
        vertical: true,
        children: [
            GeminiInfo(),
            GoogleAiInstructions(),
            GeminiSettings(),
        ]
    })
});

export const chatContent = Box({
    className: 'spacing-v-5',
    vertical: true,
    setup: (self) => self
        .hook(GeminiService, (box, id) => {
            const message = GeminiService.messages[id];
            if (!message) return;
            box.add(ChatMessage(message, MODEL_NAME))
        }, 'newMsg')
    ,
});

const clearChat = () => {
    GeminiService.clear();
    const children = chatContent.get_children();
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        child.destroy();
    }
}

const CommandButton = (command) => Button({
    className: 'sidebar-chat-toolbar-btn',
    child: Box({
        className: 'spacing-h-5',
        children: [
            MaterialIcon(
                command === '/help' ? 'help' :
                command === '/clear' ? 'delete' :
                command === '/model' ? 'model_training' :
                command === '/tuneall' ? 'settings_suggest' :
                'key',
                'larger'
            ),
            Label({
                label: command.slice(1),
            }),
        ],
    }),
    setup: setupCursorHover,
    onClicked: () => sendMessage(command),
    tooltipText: command === '/clear' ? 'Clear chat' : 
                command === '/help' ? 'Show help' :
                command === '/model' ? 'Switch model' :
                command === '/tuneall' ? 'Replace prompt' :
                'Set API key',
});

const UploadButton = () => Button({
    className: 'sidebar-chat-toolbar-btn',
    child: Box({
        className: 'spacing-h-5',
        children: [
            MaterialIcon('upload_file', 'larger'),
            Label({
                label: 'Upload',
            }),
        ],
    }),
    setup: setupCursorHover,
    onClicked: () => {
        // Hide sidebar while file picker is open
        App.toggleWindow("sideleft");
        
        const dialog = new Gtk.FileChooserDialog({
            title: 'Select a PDF or Image file',
            action: Gtk.FileChooserAction.OPEN,
        });
        dialog.add_button('Cancel', Gtk.ResponseType.CANCEL);
        dialog.add_button('Open', Gtk.ResponseType.ACCEPT);

        const pdfFilter = new Gtk.FileFilter();
        pdfFilter.set_name('PDF files');
        pdfFilter.add_mime_type('application/pdf');
        dialog.add_filter(pdfFilter);

        const imageFilter = new Gtk.FileFilter();
        imageFilter.set_name('Image files');
        imageFilter.add_mime_type('image/png');
        imageFilter.add_mime_type('image/jpeg');
        dialog.add_filter(imageFilter);

        dialog.connect('response', (dialog, response) => {
            if (response === Gtk.ResponseType.ACCEPT) {
                const path = dialog.get_file().get_path();
                const mimeType = Utils.exec(`file --mime-type -b "${path}"`).trim();

                // Show sidebar again after file is selected
                App.toggleWindow("sideleft");

                if (mimeType === 'application/pdf') {
                    try {
                        const tempDir = GLib.get_tmp_dir();
                        const timestamp = new Date().getTime();
                        const textPath = GLib.build_filenamev([tempDir, `pdf_text_${timestamp}.txt`]);
                        
                        console.log('Processing PDF:', path);
                        console.log('Temp text file:', textPath);
                        
                        // First check if pdftotext is available
                        const hasPdfToText = Utils.exec('which pdftotext').trim() !== '';
                        if (!hasPdfToText) {
                            console.error('pdftotext not found. Please install poppler-utils');
                            chatContent.add(SystemMessage('pdftotext not found. Please install poppler-utils', '/pdf', geminiView));
                            return;
                        }

                        Utils.execAsync(['pdftotext', path, textPath])
                            .then(() => {
                                console.log('PDF text extraction completed');
                                const content = Utils.readFile(textPath);
                                console.log('Extracted text length:', content?.length || 0);
                                
                                if (content) {
                                    GeminiService.send(`Here's the content of the PDF file:\n\n${content}`);
                                } else {
                                    console.error('No text content extracted from PDF');
                                    chatContent.add(SystemMessage('No text could be extracted from the PDF', '/pdf', geminiView));
                                }
                                // Clean up temp file
                                try {
                                    GLib.unlink(textPath);
                                    console.log('Temp file cleaned up');
                                } catch (e) {
                                    console.error('Error cleaning up temp file:', e);
                                }
                            })
                            .catch(error => {
                                console.error('Error executing pdftotext:', error);
                                chatContent.add(SystemMessage(`Failed to process PDF file: ${error}`, '/pdf', geminiView));
                            });
                    } catch (error) {
                        console.error('Error in PDF processing setup:', error);
                        chatContent.add(SystemMessage(`Failed to process PDF file: ${error}`, '/pdf', geminiView));
                    }
                } else if (mimeType.startsWith('image/')) {
                    GeminiService.sendWithImage("What's in this image?", path);
                }
            } else {
                // Show sidebar again if cancelled
                App.toggleWindow("sideleft");
            }
            dialog.destroy();
        });

        dialog.show();
    },
    tooltipText: 'Upload file (PDF/Image)',
});

const handleClipboardImage = () => {
    const clipboard = Gtk.Clipboard.get(Gdk.SELECTION_CLIPBOARD);
    if (clipboard.wait_is_image_available()) {
        const pixbuf = clipboard.wait_for_image();
        if (!pixbuf) {
            chatContent.add(SystemMessage('No image found in clipboard', 'Error', geminiView));
            return false;
        }
        
        // Save the image to a temporary file
        const tempDir = GLib.get_tmp_dir();
        const timestamp = new Date().getTime();
        const tempPath = GLib.build_filenamev([tempDir, `gemini_clipboard_${timestamp}.png`]);
        
        try {
            pixbuf.savev(tempPath, 'png', [], []);
            return tempPath;
        } catch (error) {
            chatContent.add(SystemMessage(`Error saving clipboard image: ${error.message}`, 'Error', geminiView));
            return false;
        }
    }
    return false;
};

export const sendMessage = (text) => {
    if (!text) return;

    // Handle commands
    if (text.startsWith('/')) {
        if (text === '/help') {
            const helpText = `Available commands:
/help - Show this help message
/clear - Clear chat history
/key - Set API key
/model - Switch between Gemini models
/tuneall [text] - Replace entire prompt
/tune default - Reset to default behavior

Example prompts:
• /tuneall You should use more emojis 😊
• /tuneall Please be more technical in your responses
• /tuneall You are a helpful assistant that specializes in Linux
• /tuneall You are a casual and friendly assistant that uses emojis`;
            chatContent.add(SystemMessage(helpText, '/help', geminiView));
            return;
        }

        if (text === '/clear') {
            clearChat();
            return;
        }

        if (text === '/key') {
            chatContent.add(SystemMessage('Please enter your API key:', '/key', geminiView));
            return;
        }

        if (text === '/model') {
            GeminiService._modelIndex = (GeminiService._modelIndex + 1) % CHAT_MODELS.length;
            const modelName = CHAT_MODELS[GeminiService._modelIndex];
            chatContent.add(SystemMessage(`Switched to ${modelName}`, '/model', geminiView));
            return;
        }

        // Handle tuning commands
        if (text.startsWith('/tuneall')) {
            const newPrompt = text.slice('/tuneall'.length).trim();
            
            // Show help if no argument
            if (!newPrompt) {
                const currentPrompt = GeminiService._customPrompt || '(none)';
                chatContent.add(SystemMessage(`Current custom prompt:\n${currentPrompt}\n\nUse:\n• /tuneall [instructions] to replace prompt\n• /tuneall default to reset`, '/tuneall', geminiView));
                return;
            }
            
            // Handle default case
            if (newPrompt === 'default') {
                GeminiService.clearCustomPrompt();
                chatContent.add(SystemMessage('Custom prompt cleared. Using default behavior.', '/tuneall', geminiView));
                return;
            }
            
            // Set new prompt
            if (GeminiService.setCustomPrompt(newPrompt)) {
                chatContent.add(SystemMessage('Custom prompt replaced! New conversations will use this prompt.', '/tuneall', geminiView));
            } else {
                chatContent.add(SystemMessage('Failed to update custom prompt.', 'Error', geminiView));
            }
            return;
        }

        // Handle API key input
        if (GeminiService._key === '') {
            Utils.writeFile(text, KEY_FILE_LOCATION)
                .then(() => {
                    GeminiService._key = text;
                    chatContent.add(SystemMessage('API key set successfully!', '/key', geminiView));
                })
                .catch(error => {
                    console.error(error);
                    chatContent.add(SystemMessage('Failed to save API key', '/key', geminiView));
                });
            return;
        }

        // Invalid command
        chatContent.add(SystemMessage(getString(`Invalid command.`), 'Error', geminiView));
        return;
    }

    // Handle normal messages
    GeminiService.send(text);
};

export const geminiCommands = Box({
    className: 'spacing-h-5',
    children: [
        Box({ hexpand: true }),
        CommandButton('/help'),
        ...(GeminiService._key === '' ? [CommandButton('/key')] : []),
        CommandButton('/model'),
        // CommandButton('/tuneall'),
        CommandButton('/clear'),
        UploadButton(),
    ]
});

export const geminiView = Box({
    homogeneous: true,
    vertical: true,
    attribute: {
        'pinnedDown': true
    },
    children: [
        Scrollable({
            className: 'sidebar-chat-viewport',
            vexpand: true,
            child: Box({
                vertical: true,
                children: [
                    geminiWelcome,
                    chatContent,
                ]
            }),
            setup: (scrolledWindow) => {
                // Show scrollbar
                scrolledWindow.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
                const vScrollbar = scrolledWindow.get_vscrollbar();
                vScrollbar.get_style_context().add_class('sidebar-scrollbar');
                // Avoid click-to-scroll-widget-to-view behavior
                Utils.timeout(1, () => {
                    const viewport = scrolledWindow.child;
                    viewport.set_focus_vadjustment(new Gtk.Adjustment(undefined));
                })
                // Always scroll to bottom with new content
                const adjustment = scrolledWindow.get_vadjustment();

                adjustment.connect("changed", () => {
                    if (!geminiView.attribute.pinnedDown) { return; }
                    adjustment.set_value(adjustment.get_upper() - adjustment.get_page_size());
                })

                adjustment.connect("value-changed", () => {
                    geminiView.attribute.pinnedDown = adjustment.get_value() == (adjustment.get_upper() - adjustment.get_page_size());
                });
            }
        })
    ]
});

const MessageContent = (msg, type = 'user', view = geminiView) => Widget.Box({
    vertical: true,
    children: [
        Widget.Box({
            class_name: `message ${type}`,
            vertical: true,
            children: [
                Widget.Label({
                    class_name: 'text',
                    label: msg.text || '',
                    hpack: type === 'user' ? 'end' : 'start',
                    wrap: true,
                    selectable: true,
                    max_width_chars: 60,
                }),
                // Add execute button if message contains code block
                ...msg.text?.includes('```') ? [Widget.Button({
                    class_name: 'execute-btn',
                    hpack: 'start',
                    label: ' Execute in Kitty',
                    setup: btn => btn.on_clicked = () => {
                        // Extract code from the message
                        const code = msg.text.match(/```(?:\w+\n|\n)?([^`]+)```/)?.[1]?.trim();
                        if (code) {
                            Utils.execAsync(['kitty', '--class', 'floating', '-e', 'bash', '-c', `${code}; echo "\nPress any key to exit..."; read -n 1`]);
                        }
                    }
                })] : []
            ]
        })
    ]
});