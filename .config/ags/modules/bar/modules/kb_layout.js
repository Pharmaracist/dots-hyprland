import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import { languages } from "../../.commonwidgets/statusicons_languages.js";
const { GLib } = imports.gi;

/**
 * Checks if a word matches a given abbreviation using a loose matching algorithm.
 */
function isLanguageMatch(abbreviation, word) {
  const lowerAbbreviation = abbreviation.toLowerCase();
  const lowerWord = word.toLowerCase();
  let j = 0;
  for (let i = 0; i < lowerWord.length; i++) {
    if (lowerWord[i] === lowerAbbreviation[j]) {
      j++;
    }
    if (j === lowerAbbreviation.length) {
      return true;
    }
  }
  return false;
}

/**
 * Generates a keyboard layout widget using Hyprland's keyboard layout information.
 */
const HyprlandXkbKeyboardLayout = async ({ useFlag } = {}) => {
  try {
    const Hyprland = (
      await import("resource:///com/github/Aylur/ags/service/hyprland.js")
    ).default;

    let languageStackArray = [];

    const updateCurrentKeyboards = () => {
      const deviceData = JSON.parse(Utils.exec("hyprctl -j devices"));
      const uniqueLayouts = [
        ...new Set(
          deviceData.keyboards.flatMap((keyboard) =>
            keyboard.layout.split(",").map((lang) => lang.trim()),
          ),
        ),
      ];

      languageStackArray = uniqueLayouts.map((layout) => {
        const lang = languages.find((lang) => lang.layout === layout);
        if (!lang) {
          return {
            [layout]: Widget.Label({ label: layout.toUpperCase() }),
          };
        }
        return {
          [lang.layout]: Widget.Label({
            label: useFlag ? lang.flag : lang.layout.toUpperCase(),
          }),
        };
      });
    };

    updateCurrentKeyboards();

    const widgetRevealer = Widget.Revealer({
      transition: "slide_left",
      transitionDuration: userOptions.asyncGet().animations.durationSmall,
      revealChild: languageStackArray.length > 1,
    });

    const widgetChildren = languageStackArray.reduce(
      (acc, lang) => ({ ...acc, ...lang }),
      { undef: Widget.Label({ label: "?" }) },
    );

    const widgetContent = Widget.Stack({
      transition: "slide_up_down",
      transitionDuration: userOptions.asyncGet().animations.durationSmall,
      children: widgetChildren,
      setup: (self) =>
        self.hook(
          Hyprland,
          (stack, kbName, layoutName) => {
            if (!kbName || !layoutName) {
              stack.shown = "undef";
              return;
            }

            const matchedLang =
              languages.find((lang) => layoutName.includes(lang.name)) ||
              languageStackArray.find((lang) =>
                isLanguageMatch(Object.keys(lang)[0], layoutName),
              );

            stack.shown = matchedLang ? Object.keys(matchedLang)[0] : "undef";
          },
          "keyboard-layout",
        ),
    });

    widgetRevealer.child = widgetContent;
    return widgetRevealer;
  } catch (error) {
    console.error("Error creating keyboard layout widget:", error);
    return null;
  }
};

/**
 * Creates an optional keyboard layout widget instance.
 */
const OptionalKeyboardLayout = async () => {
  try {
    return await HyprlandXkbKeyboardLayout({
      useFlag: userOptions.asyncGet().appearance.keyboardUseFlag,
    });
  } catch (error) {
    console.error("Error creating optional keyboard layout:", error);
    return null;
  }
};

/**
 * Creates multiple keyboard layout widget instances for each monitor.
 */
const createKeyboardLayoutInstances = async () => {
  try {
    const Hyprland = (
      await import("resource:///com/github/Aylur/ags/service/hyprland.js")
    ).default;
    const monitorsCount = Hyprland.monitors.length;

    const instances = await Promise.all(
      Array.from({ length: monitorsCount }, () => OptionalKeyboardLayout()),
    );

    return instances.filter(Boolean); // Filter out any null instances
  } catch (error) {
    console.error("Error creating keyboard layout instances:", error);
    return [];
  }
};

const optionalKeyboardLayoutInstances = await createKeyboardLayoutInstances();

/**
 * Main widget export.
 */
export default () =>
  Widget.Box({
    className: "spacing-h-10",
    children: optionalKeyboardLayoutInstances.map((instance) =>
      Widget.Box({
        className: "spacing-h-10",
        children: [instance],
      }),
    ),
  });
