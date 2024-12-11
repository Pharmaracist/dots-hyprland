import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

const { execAsync, exec } = Utils;
const { Box, Label, Overlay } = Widget;

// Define your quotes array
const quotes = [
  {
    quote: "Nvidia, fuck you",
    author: "Linus Torvalds",
  },
  {
    quote: "reproducible system? cock and vagina?",
    author: "vaxry",
  },
  {
    quote:
      "haha pointers hee hee i love pointe-\\\nProcess Vaxry exited with signal SIGSEGV",
    author: "vaxry",
  },
];

// Function to get a random quote
const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};

// Create a widget that displays a random quote
const QuoteWidget = () => {
  const { quote, author } = getRandomQuote();
  return Box({
    vertical: true,
    className: "quote-widget", // Class name for styling
    children: [
      Label({
        label: `<b>${quote}</b>`,
        useMarkup: true,
        className: "quote-text",
      }),
      Label({
        label: `— ${author}`,
        useMarkup: true,
        className: "quote-author",
      }),
    ],
  });
};

// Create an overlay to position the widget in the bottom-right
const BottomRightQuoteWidget = () =>
  Overlay({
    className: "quote-positioner",
    child: QuoteWidget(),
    vexpand: true, // Allow vertical expansion
    hexpand: true, // Allow horizontal expansion
    valign: "end", // Align to the bottom vertically
    halign: "end", // Align to the right horizontally
  });

// Export the positioned widget
export default BottomRightQuoteWidget;
