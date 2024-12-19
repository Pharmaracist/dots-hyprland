import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
const { Box, Button } = Widget;

// Create a global state object to track revealer states
export const RevealerState = {
    isRevealed: false,
    revealers: new Set(),

    // Register a revealer to be controlled
    register(revealer) {
        this.revealers.add(revealer);
        return revealer;
    },

    // Toggle all registered revealers
    toggleAll() {
        this.isRevealed = !this.isRevealed;
        this.revealers.forEach(revealer => {
            revealer.revealChild = this.isRevealed;
        });
    }
};

// Create the control button widget
const RevealerControl = () => {
    const button = Button({
        className: "revealer-control-button txt-norm",
        child: Box({
            children: [
                MaterialIcon("expand_more", "norm"),
            ]
        }),
        onClicked: () => {
            RevealerState.toggleAll();
            button.child.children[0].icon = RevealerState.isRevealed ? "expand_less" : "expand_more";
        },
    });

    return button;
};

export default RevealerControl;
