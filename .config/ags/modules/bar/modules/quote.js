import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Quotes from '../../../services/quotes.js';

const { Box, Label, EventBox } = Widget;

// Update interval: 3 hours in milliseconds
const UPDATE_INTERVAL = 3 * 60 * 60 * 1000;

const QuoteWidget = () => {
    // Create widget with initial content
    const label = Label({
        className: 'bar-time',
        label: 'Loading quote...',
        justification: 'left',
        wrap: true,
        wrapMode: 'word',  // Wrap at word boundaries
        widthChars: 60,    // Force width to roughly 10rem
        maxWidthChars: 60, // Maximum width in characters
        xalign: 0,   
        css: 'min-height: 2.4em;',
    });

    // Create the main widget
    const widget = EventBox({
        onPrimaryClick: () => {
            console.log('Quote widget clicked, fetching new quote...');
            label.label = 'Loading...';
            Quotes.fetch();
        },
        child: Box({
            className: 'bar-time spacing-h-5',
            hexpand: false,
            vexpand: true,
            css: 'min-width: 10rem;',
            children: [label],
        }),
    });

    // Update label when service changes
    const updateLabel = () => {
        console.log('Quote widget: Updating label...');
        console.log('Service state:', {
            loading: Quotes.loading,
            content: Quotes.content,
            author: Quotes.author,
        });

        if (Quotes.loading) {
            label.label = 'Loading...';
            return;
        }

        if (!Quotes.content || !Quotes.author) {
            label.label = 'Click to retry';
            return;
        }

        label.label = `"${Quotes.content}" —${Quotes.author}`;
    };

    // Connect to service changes
    widget.hook(Quotes, updateLabel);

    // Set up polling
    widget.poll(UPDATE_INTERVAL, () => {
        console.log('Quote widget: Poll triggered...');
        Quotes.fetch();
    });

    return widget;
};

// Export a function that returns the widget
export default () => {
    console.log('Creating quote widget...');
    return QuoteWidget();
};
