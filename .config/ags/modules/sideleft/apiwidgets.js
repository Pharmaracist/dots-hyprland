const { Gtk, Gdk } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Button, CenterBox, Entry, EventBox, Icon, Label, Overlay, Revealer, Scrollable, Stack } = Widget;
const { execAsync, exec } = Utils;
import { setupCursorHover, setupCursorHoverInfo } from '../.widgetutils/cursorhover.js';
import { MaterialIcon } from '../.commonwidgets/materialicon.js';
import { enableClickthrough } from "../.widgetutils/clickthrough.js";
import { checkKeybind } from '../.widgetutils/keybind.js';
import { widgetContent } from './sideleft.js';
import { IconTabContainer } from '../.commonwidgets/tabcontainer.js';
import { writable } from '../../modules/.miscutils/store.js';
import { fileExists } from '../.miscutils/files.js';
import GLib from 'gi://GLib';
import { SystemMessage } from './apis/ai_chatmessage.js';
const TextView = Widget.subclass(Gtk.TextView, "AgsTextView");

// APIs
import GPTService from '../../services/gpt.js';
import Gemini from '../../services/gemini.js';
import YTMusic from '../../services/ytmusic.js';
import QuranService from '../../services/quran.js';
import WallpaperService from '../../services/wallpapers.js';
import { geminiView, geminiCommands, sendMessage as geminiSendMessage, geminiTabIcon } from './apis/gemini.js';
import { chatGPTView, chatGPTCommands, sendMessage as chatGPTSendMessage, chatGPTTabIcon } from './apis/chatgpt.js';
import { TranslaterView, translaterCommands, sendMessage as translaterSendMessage, translaterIcon } from './apis/translater.js';
import { ytmusicView, ytmusicCommands, sendMessage as ytmusicSendMessage, ytmusicTabIcon, MediaControls } from './apis/ytmusic.js';
import { quranView, quranCommands, sendMessage as quranSendMessage, quranTabIcon } from './apis/quran.js';
import { wallpaperView, wallpaperCommands, sendMessage as wallpaperSendMessage, wallpaperTabIcon } from './apis/wallpapers.js';

// Create a custom icon for YouTube Music

const EXPAND_INPUT_THRESHOLD = 30;
const APILIST = {
    'wallpapers': {
        name: 'Wallpapers',
        sendCommand: wallpaperSendMessage,
        contentWidget: wallpaperView,
        commandBar: wallpaperCommands,
        tabIcon: wallpaperTabIcon,
        placeholderText: 'Describe your dream wallpaper...',
    },
    'quran': {
        name: 'Quran',
        sendCommand: quranSendMessage,
        contentWidget: quranView,
        commandBar: quranCommands,
        tabIcon: quranTabIcon,
    
        placeholderText: 'وَقُل رَّبِّ زِدْنِي عِلْمًا'
    },
    'gemini': {
        name: 'Assistant (Gemini Pro)',
        sendCommand: geminiSendMessage,
        contentWidget: geminiView,
        commandBar: geminiCommands,
        tabIcon: geminiTabIcon,
        placeholderText: 'Message Gemini...',
    },
    'gpt': {
        name: 'Assistant (GPTs)',
        sendCommand: chatGPTSendMessage,
        contentWidget: chatGPTView,
        commandBar: chatGPTCommands,
        tabIcon: chatGPTTabIcon,
        placeholderText: 'Message the model...',
    },
    'translater': {
        name: 'Google Translater',
        sendCommand: translaterSendMessage,
        contentWidget: TranslaterView,
        tabIcon: translaterIcon,
        commandBar: translaterCommands,
        placeholderText: 'Translate the text...'
    },
    'ytmusic': {
    name: 'YouTube Music',
    sendCommand: ytmusicSendMessage,
    contentWidget: ytmusicView,
    commandBar: ytmusicCommands,
    tabIcon: ytmusicTabIcon,
    placeholderText: 'Search music...',
},
}

let APIS = writable ([]);

userOptions.subscribe ((n) => {
    APIS.set(n.sidebar.pages.apis.order.map((apiName) => APILIST[apiName]))
});

let currentApiId = 0;

function apiSendMessage(textView) {
    // Get text
    const buffer = textView.get_buffer();
    const [start, end] = buffer.get_bounds();
    const text = buffer.get_text(start, end, true);
    if (!text || text.trim().length === 0) return;
    
    // Only send if the current API has a sendCommand function
    const currentApi = APIS.asyncGet()[currentApiId];
    if (currentApi && currentApi.sendCommand) {
        currentApi.sendCommand(text.trim());
    }
    
    // Don't reset the buffer here - let the API handle it
    chatEntryWrapper.toggleClassName('sidebar-chat-wrapper-extended', false);
    chatEntry.set_valign(Gtk.Align.CENTER);
}

export const chatEntry = TextView({
    hexpand: true,
    wrapMode: Gtk.WrapMode.WORD_CHAR,
    acceptsTab: false,
    className: 'sidebar-chat-entry txt txt-smallie',
    setup: (self) => self
        .hook(GPTService, (self) => {
            if (APIS.asyncGet()[currentApiId].name != 'Assistant (GPTs)') return;
            self.placeholderText = (GPTService.key.length > 0 ? 'Message the model...' : 'Enter API Key...');
        }, 'hasKey')
        .hook(Gemini, (self) => {
            if (APIS.asyncGet()[currentApiId].name != 'Assistant (Gemini Pro)') return;
            self.placeholderText = (Gemini.key.length > 0 ? 'Message Gemini...' : 'Enter Google AI API Key...');
        }, 'hasKey')
        .on("key-press-event", (widget, event) => {
            // Swtich APIs with Tab
            const key = event.get_keyval()[1];
            if (key === Gdk.KEY_Tab || key === Gdk.KEY_ISO_Left_Tab) {
                const dir = key === Gdk.KEY_Tab ? 1 : -1;
                const newId = (currentApiId + dir + APIS.asyncGet().length) % APIS.asyncGet().length;
                switchToTab(newId);
                return true;
            }
            // Don't send when Shift+Enter
            if (event.get_keyval()[1] === Gdk.KEY_Return || event.get_keyval()[1] === Gdk.KEY_KP_Enter) {
                if (event.get_state()[1] !== 17) {
                    apiSendMessage(widget);
                    return true;
                }
                return false;
            }
            // Keybinds
            if (checkKeybind(event, userOptions.asyncGet().keybinds.sidebar.cycleTab))
                widgetContent.cycleTab();
            else if (checkKeybind(event, userOptions.asyncGet().keybinds.sidebar.nextTab))
                widgetContent.nextTab();
            else if (checkKeybind(event, userOptions.asyncGet().keybinds.sidebar.prevTab))
                widgetContent.prevTab();
            else if (checkKeybind(event, userOptions.asyncGet().keybinds.sidebar.apis.nextTab)) {
                apiWidgets.attribute.nextTab();
                return true;
            }
            else if (checkKeybind(event, userOptions.asyncGet().keybinds.sidebar.apis.prevTab)) {
                apiWidgets.attribute.prevTab();
                return true;
            }
        })
    ,
});

chatEntry.get_buffer().connect("changed", (buffer) => {
    const bufferText = buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), true);
    chatSendButton.toggleClassName('sidebar-chat-send-available', bufferText.length > 0);
    chatPlaceholderRevealer.revealChild = (bufferText.length == 0);
    if (buffer.get_line_count() > 1 || bufferText.length > EXPAND_INPUT_THRESHOLD) {
        chatEntryWrapper.toggleClassName('sidebar-chat-wrapper-extended', true);
        chatEntry.set_valign(Gtk.Align.FILL);
        chatPlaceholder.set_valign(Gtk.Align.FILL);
    }
    else {
        chatEntryWrapper.toggleClassName('sidebar-chat-wrapper-extended', false);
        chatEntry.set_valign(Gtk.Align.CENTER);
        chatPlaceholder.set_valign(Gtk.Align.CENTER);
    }
});

const chatEntryWrapper = Scrollable({
    className: 'sidebar-chat-wrapper',
    hscroll: 'never',
    vscroll: 'always',
    child: chatEntry,
});

const chatSendButton = Button({
    className: 'txt-norm icon-material sidebar-chat-send',
    vpack: 'end',
    label: 'arrow_upward',
    setup: setupCursorHover,
    onClicked: (self) => {
        APIS.asyncGet()[currentApiId].sendCommand(chatEntry);
        chatEntry.get_buffer().set_text("", -1);
    },
});

const chatScreenshotButton = Button({
    className: 'sidebar-chat-chip sidebar-chat-chip-action txt-small',
    vpack: 'end',
    setup: setupCursorHover,
    tooltipText: 'Take a screenshot',
    child: MaterialIcon('screenshot_region', 'small'),
    onClicked: () => sendScreenshotToGemini(),
});

const chatPlaceholder = Label({
    className: 'txt-subtext txt-smallie margin-left-5',
    hpack: 'start',
    vpack: 'center',
    label: APIS.asyncGet()[currentApiId].placeholderText,
});

const chatPlaceholderRevealer = Revealer({
    revealChild: true,
    transition: 'crossfade',
    transitionDuration: userOptions.asyncGet().animations.durationLarge,
    child: chatPlaceholder,
    setup: enableClickthrough,
});

const textboxArea = Box({ // Entry area
    className: 'sidebar-chat-textarea',
    children: [
        Overlay({
            passThrough: true,
            child: chatEntryWrapper,
            overlays: [chatPlaceholderRevealer],
        }),
        Box({ className: 'width-10' }),
        Box({
            className: 'spacing-h-5',
            children: [
                chatScreenshotButton,
                chatSendButton,
            ],
        }),
    ]
});

const apiCommandStack = Stack({
    transition: 'slide_up_down',
    transitionDuration: userOptions.asyncGet().animations.durationLarge,
    children: APIS.asyncGet().reduce((acc, api) => {
        acc[api.name] = api.commandBar;
        return acc;
    }, {})
})

export let apiContentStack = IconTabContainer({
    tabSwitcherClassName: 'sidebar-icontabswitcher',
    className: 'margin-top-5',
    iconWidgets: APIS.asyncGet().map((api) => api.tabIcon),
    names: APIS.asyncGet().map((api) => api.name),
    children: APIS.asyncGet().map((api) => api.contentWidget),
    onChange: (self, id) => {
        apiCommandStack.shown = APIS.asyncGet()[id].name;
        chatPlaceholder.label = APIS.asyncGet()[id].placeholderText;
        currentApiId = id;
    }
});

function switchToTab(id) {
    apiContentStack.shown.value = id;
}

const apiWidgets = Widget.Box({
    attribute: {
        'nextTab': () => switchToTab(Math.min(currentApiId + 1, APIS.asyncGet().length - 1)),
        'prevTab': () => switchToTab(Math.max(0, currentApiId - 1)),
    },
    vertical: true,
    className: 'spacing-v-10',
    homogeneous: false,
    children: [
        apiContentStack,
        apiCommandStack,
        textboxArea,
    ],
});

export default apiWidgets;
