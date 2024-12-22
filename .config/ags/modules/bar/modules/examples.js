import IconWidget from './icon.js';

// Simple icon
export const archIcon = () => IconWidget({
    icon: 'arch-symbolic',  // no need to add .svg, the module adds it
    size: 24,
});

// Icon with custom class
export const githubIcon = () => IconWidget({
    icon: 'github-symbolic',
    size: 20,
    className: 'github-icon',
});

// Multiple icons in a row example
export const distroIcons = () => Widget.Box({
    className: 'distro-icons',
    spacing: 8,
    children: [
        IconWidget({
            icon: 'arch-symbolic',
            size: 20,
        }),
        IconWidget({
            icon: 'debian-symbolic',
            size: 20,
        }),
        IconWidget({
            icon: 'ubuntu-symbolic',
            size: 20,
        }),
    ],
});
