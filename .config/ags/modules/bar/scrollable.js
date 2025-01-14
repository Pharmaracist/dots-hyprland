   Widget.Scrollable({
          hscroll: 'never',
          css: `
            min-width: 2rem;
            min-height: 2rem;
            margin: 0.25rem;
          `,
          vscroll: 'automatic',
          child: Widget.Box({
            vertical: true,
            className: "spacing-v-5 module-container",
            css: 'min-height: 2rem;',
            children: [
              Widget.Box({
                className: 'module-box',
                css: 'min-height: 2rem;',
                child: userOptions.asyncGet().bar.elements.showWorkspaces ? await NormalOptionalWorkspaces() : null,
              }),
            ] //filter(box => box.child !== null), // Remove boxes with null children
          }),
        })