const { Gdk, Gio, Pango, GLib, Gtk } = imports.gi;
import GtkSource from "gi://GtkSource?version=3.0";
import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import GeminiService from '../../../services/gemini.js';
const { Box, Button, Label, Icon, Scrollable, Stack } = Widget;
const { execAsync, exec } = Utils;
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';
import md2pango from '../../.miscutils/md2pango.js';
import { darkMode } from "../../.miscutils/system.js";
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';

const LATEX_DIR = `${GLib.get_user_cache_dir()}/ags/media/latex`;
const CUSTOM_SOURCEVIEW_SCHEME_PATH = `${App.configDir}/assets/themes/sourceviewtheme${darkMode.value ? '' : '-light'}.xml`;
const CUSTOM_SCHEME_ID = `custom${darkMode.value ? '' : '-light'}`;
const USERNAME = GLib.get_user_name();

/////////////////////// Custom source view colorscheme /////////////////////////

function loadCustomColorScheme(filePath) {
    // Read the XML file content
    const file = Gio.File.new_for_path(filePath);
    const [success, contents] = file.load_contents(null);

    if (!success) {
        logError('Failed to load the XML file.');
        return;
    }

    // Parse the XML content and set the Style Scheme
    const schemeManager = GtkSource.StyleSchemeManager.get_default();
    schemeManager.append_search_path(file.get_parent().get_path());
}
loadCustomColorScheme(CUSTOM_SOURCEVIEW_SCHEME_PATH);

//////////////////////////////////////////////////////////////////////////////

function substituteLang(str) {
    const subs = [
        { from: 'javascript', to: 'js' },
        { from: 'bash', to: 'sh' },
    ];
    for (const { from, to } of subs) {
        if (from === str) return to;
    }
    return str;
}

const HighlightedCode = (content, lang) => {
    const buffer = new GtkSource.Buffer();
    const sourceView = new GtkSource.View({
        buffer: buffer,
        wrap_mode: Gtk.WrapMode.NONE
    });
    const langManager = GtkSource.LanguageManager.get_default();
    let displayLang = langManager.get_language(substituteLang(lang)); // Set your preferred language
    if (displayLang) {
        buffer.set_language(displayLang);
    }
    const schemeManager = GtkSource.StyleSchemeManager.get_default();
    buffer.set_style_scheme(schemeManager.get_scheme(CUSTOM_SCHEME_ID));
    buffer.set_text(content, -1);
    return sourceView;
}

const TextBlock = (content = '') => Label({
    hpack: 'fill',
    className: 'txt sidebar-chat-txtblock sidebar-chat-txt',
    useMarkup: true,
    xalign: 0,
    wrap: true,
    selectable: true,
    label: md2pango(content),
});

Utils.execAsync(['bash', '-c', `rm -rf ${LATEX_DIR}`])
    .then(() => Utils.execAsync(['bash', '-c', `mkdir -p ${LATEX_DIR}`]))
    .catch(print);
const Latex = (content = '') => {
    const latexViewArea = Box({
        // vscroll: 'never',
        // hscroll: 'automatic',
        // homogeneous: true,
        attribute: {
            render: async (self, text) => {
                if (text.length == 0) return;
                const styleContext = self.get_style_context();
                const fontSize = styleContext.get_property('font-size', Gtk.StateFlags.NORMAL);

                const timeSinceEpoch = Date.now();
                const fileName = `${timeSinceEpoch}.tex`;
                const outFileName = `${timeSinceEpoch}-symbolic.svg`;
                const outIconName = `${timeSinceEpoch}-symbolic`;
                const scriptFileName = `${timeSinceEpoch}-render.sh`;
                const filePath = `${LATEX_DIR}/${fileName}`;
                const outFilePath = `${LATEX_DIR}/${outFileName}`;
                const scriptFilePath = `${LATEX_DIR}/${scriptFileName}`;

                Utils.writeFile(text, filePath).catch(print);
                // Since MicroTex doesn't support file path input properly, we gotta cat it
                // And escaping such a command is a fucking pain so I decided to just generate a script
                // Note: MicroTex doesn't support `&=`
                // You can add this line in the middle for debugging: echo "$text" > ${filePath}.tmp
                const renderScript = `#!/usr/bin/env bash
text=$(cat ${filePath} | sed 's/$/ \\\\\\\\/g' | sed 's/&=/=/g')
cd /opt/MicroTeX
./LaTeX -headless -input="$text" -output=${outFilePath} -textsize=${fontSize * 1.1} -padding=0 -maxwidth=${latexViewArea.get_allocated_width() * 0.85} > /dev/null 2>&1
sed -i 's/fill="rgb(0%, 0%, 0%)"/style="fill:#000000"/g' ${outFilePath}
sed -i 's/stroke="rgb(0%, 0%, 0%)"/stroke="${darkMode.value ? '#ffffff' : '#000000'}"/g' ${outFilePath}
`;
                Utils.writeFile(renderScript, scriptFilePath).catch(print);
                Utils.exec(`chmod a+x ${scriptFilePath}`)
                Utils.timeout(100, () => {
                    Utils.exec(`bash ${scriptFilePath}`);
                    Gtk.IconTheme.get_default().append_search_path(LATEX_DIR);

                    self.child?.destroy();
                    self.child = Gtk.Image.new_from_icon_name(outIconName, 0);
                })
            }
        },
        setup: (self) => self.attribute.render(self, content).catch(print),
    });
    const wholeThing = Box({
        className: 'sidebar-chat-latex',
        homogeneous: true,
        attribute: {
            'updateText': (text) => {
                latexViewArea.attribute.render(latexViewArea, text).catch(print);
            }
        },
        children: [Scrollable({
            vscroll: 'never',
            hscroll: 'automatic',
            child: latexViewArea
        })]
    })
    return wholeThing;
}

const CodeBlock = (content = '', lang = 'txt') => {
    if (lang == 'tex' || lang == 'latex') {
        return Latex(content);
    }
    const topBar = Box({
        className: 'sidebar-chat-codeblock-topbar',
        children: [
            Label({
                label: lang,
                className: 'sidebar-chat-codeblock-topbar-txt',
            }),
            Box({
                hexpand: true,
            }),
            Button({
                className: 'sidebar-chat-codeblock-topbar-btn',
                child: Box({
                    className: 'spacing-h-5',
                    children: [
                        MaterialIcon('content_copy', 'small'),
                        Label({
                            label: 'Copy',
                        })
                    ]
                }),
                onClicked: (self) => {
                    const buffer = sourceView.get_buffer();
                    const copyContent = buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), false);
                    execAsync([`wl-copy`, `${copyContent}`]).catch(print);
                },
                setup: setupCursorHover,
            }),
            Button({
                className: 'sidebar-chat-codeblock-topbar-btn',
                child: Box({
                    className: 'spacing-h-5',
                    children: [
                        MaterialIcon('terminal', 'small'),
                        Label({
                            label: 'Execute',
                        })
                    ]
                }),
                onClicked: (self) => {
                    const buffer = sourceView.get_buffer();
                    const code = buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), false);
                    if (code) {
                        Utils.execAsync(['foot', '-a', 'floating', 'bash', '-c', `${code}; echo "\nPress any key to exit..."; read -n 1`]);
                    }
                },
                setup: setupCursorHover,
            }),
        ]
    })
    // Source view
    const sourceView = HighlightedCode(content, lang);

    const codeBlock = Box({
        attribute: {
            'updateText': (text) => {
                sourceView.get_buffer().set_text(text, -1);
            },
            'type': 'code'
        },
        className: 'sidebar-chat-codeblock',
        vertical: true,
        children: [
            topBar,
            Box({
                className: 'sidebar-chat-codeblock-code',
                homogeneous: true,
                children: [Scrollable({
                    vscroll: 'never',
                    hscroll: 'automatic',
                    child: sourceView,
                })],
            })
        ]
    })

    // const schemeIds = styleManager.get_scheme_ids();

    // print("Available Style Schemes:");
    // for (let i = 0; i < schemeIds.length; i++) {
    //     print(schemeIds[i]);
    // }
    return codeBlock;
}

const Divider = () => Box({
    className: 'sidebar-chat-divider',
})

const updateContentAndBlockType = (contentBox, i, type, typeObj, text) => {
    const kids = contentBox.get_children();
    if (i < kids.length) { 
        if (kids[i].attribute.type != type) {
            kids[i] = typeObj (text);
        }
        else {
            kids[i].attribute.updateText(text);
        }
    }
    else {
        contentBox.add (typeObj (text));
    }
}

const MessageContent = (content) => {
    const contentBox = Box({
        vertical: true,
        attribute: {
            fullUpdate: (self, text, typing = false) => {
                // Clear previous children
                self.children = [];

                // Handle dividers first
                const dividerBlocks = text.split(/^\s*---\s*$/m);
                dividerBlocks.forEach((block, i) => {
                    // Process code blocks within each divider block
                    const codeBlocks = block.split('```');
                    codeBlocks.forEach((blockContent, j) => {
                        if (j % 2 === 0) {
                            // Regular text block
                            if (blockContent.trim().length > 0) {
                                self.add(TextBlock(blockContent));
                            }
                        } else {
                            // Code block
                            const lines = blockContent.trim().split('\n');
                            const lang = substituteLang(lines[0].toLowerCase());
                            const code = lines.slice(1).join('\n');
                            if (code.length > 0) {
                                self.add(CodeBlock(code, lang));
                            }
                        }
                    });

                    // Add divider if not the last block
                    if (i < dividerBlocks.length - 1) {
                        self.add(Divider());
                    }
                });

                // Add cursor
                if (typing) {
                    self.add(Label({
                        className: 'txt txt-smaller sidebar-chat-cursor',
                        label: '▌',
                    }));
                }

                // Show all children
                self.show_all();
            }
        }
    });
    contentBox.attribute.fullUpdate(contentBox, content, false);
    return contentBox;
}

const MessageArea = (message, role) => {
    const messageContentBox = MessageContent(message.content);
    const messageLoadingSkeleton = Box({
        vertical: true,
        className: 'spacing-v-5',
        children: Array.from({ length: 3 }, (_, id) => Box({
            className: `sidebar-chat-message-skeletonline sidebar-chat-message-skeletonline-offset${id}`,
        })),
    })
    const messageArea = Stack({
        homogeneous: role !== 'user',
        transition: 'crossfade',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        children: {
            'thinking': messageLoadingSkeleton,
            'message': messageContentBox,
        },
        shown: message.thinking ? 'thinking' : 'message',
    });
    return messageArea;
}

export const ChatMessage = (message, modelName = 'Model') => {
    const messageContentBox = MessageContent(message.content);
    const messageLoadingSkeleton = Box({
        vertical: true,
        className: 'spacing-v-5',
        children: Array.from({ length: 3 }, (_, id) => Box({
            className: `sidebar-chat-message-skeletonline sidebar-chat-message-skeletonline-offset${id}`,
        })),
    });

    // Add regenerate button for model responses
    const regenerateButton = message.role === 'model' ? Box({
        hpack: 'end',
        className: 'spacing-h-5 sidebar-chat-regenerate',
        children: [
            Button({
                className: 'sidebar-chat-codeblock-topbar-btn',
                child: Box({
                    className: 'spacing-h-5',
                    children: [
                        MaterialIcon('refresh', 'small'),
                        Label({
                            label: 'Regenerate',
                        })
                    ]
                }),
                setup: setupCursorHover,
                onClicked: () => {
                    // Get the last user message
                    const messages = GeminiService.messages;
                    let lastUserMsg = '';
                    for (let i = messages.length - 1; i >= 0; i--) {
                        if (messages[i].role === 'user') {
                            lastUserMsg = messages[i].parts[0].text;
                            break;
                        }
                    }
                    if (lastUserMsg) {
                        // Remove the last model response
                        GeminiService._messages.pop();
                        // Send the last user message again
                        GeminiService.send(lastUserMsg);
                    }
                },
            }),
        ]
    }) : null;

    const messageArea = Stack({
        homogeneous: message.role !== 'user',
        transition: 'crossfade',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        children: {
            'thinking': messageLoadingSkeleton,
            'message': Box({
                vertical: true,
                children: [
                    messageContentBox,
                    regenerateButton,
                ]
            }),
        },
        shown: message.thinking ? 'thinking' : 'message',
    });

    const thisMessage = Box({
        className: 'sidebar-chat-message',
        homogeneous: true,
        children: [
            Box({
                className: `sidebar-chat-messagebox ${message.role}`,
                vertical: true,
                children: [
                    Label({
                        className: `sidebar-chat-name txt-small ${message.role}`,
                        xalign: message.role == 'user' ? 1 : 0,
                        label: (message.role == 'user' ? USERNAME : modelName),
                        wrapMode: Pango.WrapMode.WORD_CHAR,
                    }),
                    Box({
                        homogeneous: true,
                        className: 'sidebar-chat-messagearea',
                        children: [messageArea]
                    })
                ],
                setup: (self) => self
                    .hook(message, () => {
                        messageArea.shown = message.thinking ? 'thinking' : 'message';
                    }, 'notify::thinking')
                    .hook(message, () => {
                        messageContentBox.attribute.fullUpdate(messageContentBox, message.content, message.role !== 'user');
                    }, 'notify::content')
                    .hook(message, () => {
                        messageContentBox.attribute.fullUpdate(messageContentBox, message.content, false);
                    }, 'notify::done')
            })
        ]
    });
    return thisMessage;
}

export const SystemMessage = (content, commandName, scrolledWindow) => {
    const messageContentBox = MessageContent(content);
    const thisMessage = Box({
        className: 'sidebar-chat-message',
        children: [
            Box({
                vertical: true,
                children: [
                    Label({
                        xalign: 0,
                        hpack: 'start',
                        className: 'txt txt-bold sidebar-chat-name sidebar-chat-name-system',
                        wrap: true,
                        label: `System  •  ${commandName}`,
                        wrapMode: Pango.WrapMode.WORD_CHAR,
                    }),
                    messageContentBox,
                ],
            })
        ],
    });
    return thisMessage;
}
