import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";

// Helper function to create a corner window
const createCornerWindow = (name, anchor, place) => {
    // Create the corner widget first
    const corner = RoundedCorner(place, { className: "corner" });
    
    // Then create the window
    const window = Widget.Window({
        name: name,
        layer: "top",
        anchor: anchor,
        exclusivity: "normal",
        visible: false, // Start hidden
        child: corner,
        setup: self => {
            // Enable clickthrough
            enableClickthrough(self);
            
            // Add cleanup handler
            self.connect('destroy', () => {
                if (corner.destroy) {
                    try {
                        corner.destroy();
                    } catch (error) {
                        console.error(`Error destroying corner ${name}:`, error);
                    }
                }
            });
        },
    });

    return window;
};

// Export factory functions that create new instances each time
export const BarCornerTopleft = () => 
    createCornerWindow('bar-corner-topleft', ["top", "left"], "topleft");

export const BarCornerTopright = () => 
    createCornerWindow('bar-corner-topright', ["top", "right"], "topright");
