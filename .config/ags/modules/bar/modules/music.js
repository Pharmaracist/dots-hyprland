import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { showMusicControls } from "../../../variables.js";
import GLib from 'gi://GLib';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import App from 'resource:///com/github/Aylur/ags/app.js';

const { Box, Label, EventBox, Button, Revealer } = Widget;

const findPlayer = () => {
  const players = Mpris.players;
  
  // Try to find YouTube Music player
  const ytPlayer = players.find(p => 
    (p.identity?.toLowerCase().includes('youtube') || 
     p.busName?.toLowerCase().includes('youtube') ||
     p.name?.toLowerCase().includes('youtube')) &&
    p.trackTitle
  );

  if (ytPlayer) return ytPlayer;

  // Fallback to any active player
  const activePlayer = players.find(p => p.trackTitle);
  if (activePlayer) return activePlayer;

  return Mpris.getPlayer("");
};

let lastScrollTime = 0;
const SCROLL_DELAY = 900; // 500ms delay between scroll actions

// Volume indicator timeout
let volumeTimeout = null;
const VOLUME_HIDE_DELAY = 1500; // 1.5 seconds

const showVolumeIndicator = (volume) => {
    // Convert volume to percentage
    const percentage = Math.round(volume * 100);
    
    // Show volume indicator
    Utils.execAsync(['notify-send', 
        '-t', '1500', 
        '-h', 'string:x-canonical-private-synchronous:volume', 
        '-h', `int:value:${percentage}`, 
        'Volume', 
        `${percentage}%`
    ]);
};

// Music Widget
export default () =>
  EventBox({
    onPrimaryClick: () => {
      App.toggleWindow('ipod');
    },
    setup: (self) => self.hook(Mpris, () => {
      const player = findPlayer();
      self.visible = player?.trackTitle ? true : false;
    }),
    child: EventBox({
      onHover: (self) => {
        self.child.children[2].revealChild = true;
      },
      onHoverLost: (self) => {
        self.child.children[2].revealChild = false;
      },
      child: Box({
        css: `padding: 0.5rem;`,
        hexpand: true,
        className: 'spacing-h-15',
        children: [
          EventBox({
            onScrollUp: (self, event) => {
              const currentTime = GLib.get_monotonic_time() / 1000;
              if (currentTime - lastScrollTime < SCROLL_DELAY) return true;
              
              const player = findPlayer();
              if (player) player.next();
              lastScrollTime = currentTime;
              return true; // Stop event propagation
            },
            onScrollDown: (self, event) => {
              const currentTime = GLib.get_monotonic_time() / 1000;
              if (currentTime - lastScrollTime < SCROLL_DELAY) return true;
              
              const player = findPlayer();
              if (player) player.previous();
              lastScrollTime = currentTime;
              return true; // Stop event propagation
            },
            child: Box({
              className: 'bar-music-art',
              setup: (self) => {
                let lastCoverPath = '';
                
                const update = () => {
                  const mpris = findPlayer();
                  if (!mpris) return;

                  const coverPath = mpris?.coverPath;
                  lastCoverPath = coverPath;
                  const defaultCSS = `
                    min-width: 2.8rem;
                    margin: 0;
                    padding: 0 0.23rem;
                    background-image: -gtk-icontheme('audio-x-generic-symbolic');
                    background-size: 1.8rem;
                    background-position: center;
                    background-repeat: no-repeat;
                    border-radius: 19px;
                    margin-right: 0.75rem;
                  `;

                  if (coverPath) {
                    if (coverPath.startsWith('http')) {
                      Utils.fetch(coverPath)
                        .then(arr => {
                          const tmpPath = `/tmp/ags-music-cover-${Date.now()}.png`;
                          Utils.writeFile(arr, tmpPath);
                          self.css = `
                            min-width: 2.8rem;
                            margin-right: 0.75rem;
                            background-image: url("file://${tmpPath}");
                            background-size: cover;
                            background-position: center;
                            border-radius: 19px;
                          `;
                          // Cleanup old cover files
                          Utils.execAsync(['sh', '-c', 'rm -f /tmp/ags-music-cover-*.png']);
                        })
                        .catch(() => {
                          self.css = defaultCSS;
                        });
                    } else {
                      self.css = `
                    min-width: 2.5rem;
                    margin: 0;
                    background-image: url("file://${coverPath}");
                    background-size: 1.8rem;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-size: cover;
                    border-radius: 18px;
                    margin-right: 0.75rem;
                  `;
                    }
                  } else {
                    self.css = defaultCSS;
                  }
                };

                // Update on player changes
                self.hook(Mpris, update);
                self.hook(Mpris, update, 'player-changed');
                
                // Force initial update
                update();

                self.connect('destroy', () => {
                  lastCoverPath = '';
                  // Cleanup all cover files on destroy
                  Utils.execAsync(['sh', '-c', 'rm -f /tmp/ags-music-cover-*.png']);
                });
              },
            }),
          }),
          Box({
            vertical: true,
            setup: (self) => {
            },
            children: [
              Label({
                className: "onSurfaceVariant txt-large",
                truncate: "end",
                xalign: 0,
                justification: "left",
                css:`min-width:15rem;`,
                hexpand: true,
                setup: (self) => {
                  let lastTitle = '';
                  const update = () => {
                    const mpris = findPlayer();
                    if (!mpris) return;
                    const newTitle = mpris.trackTitle || "";
                    if (newTitle !== lastTitle) {
                      self.label = newTitle;
                      // Walk up the widget tree to find the knocks container
                      let current = self;
                      while (current && !current.className?.includes('bar-knocks')) {
                          current = current.get_parent();
                      }
                      if (current) {
                          current.toggleClassName('song-changing', true);
                          Utils.timeout(15000, () => {
                              current.toggleClassName('song-changing', false);
                          });
                      }
                      lastTitle = newTitle;
                    }
                  };
                  self.hook(Mpris, update);
                },
              }),
              Label({
                className: "bar-music-txt txt-smallie",
                truncate: "end",
                xalign: 0,
                justification: "left",
                maxWidthChars: 25,
                setup: (self) => {
                  let lastArtist = '';
                  const update = () => {
                    const mpris = findPlayer();
                    if (!mpris) return;
                    const newArtist = mpris.trackArtists.join(", ") || "";
                    if (newArtist !== lastArtist) {
                      self.label = newArtist;
                      lastArtist = newArtist;
                    }
                  };
                  self.hook(Mpris, update);
                },
              }),
            ],
          }),
          Revealer({
            revealChild: false,
            transition: 'slide_right',
            transitionDuration: 300,
            child: Box({
              hpack: "end",
              children: [
                Widget.Box({
                 css:`min-width:2rem`     
                }), 
                Button({
                  className: 'txt-norm sec-txt bar-music-button',
                  label: '󰒮',
                  onClicked: () => {
                    const player = findPlayer();
                    if (player) player.previous();
                  },
                }),
                Button({
                  className: 'txt-norm  sec-txt bar-music-button',
                  setup: (self) => {
                    const update = () => {
                      const player = findPlayer();
                      self.label = player?.playBackStatus === 'Playing' ? '󰏤' : '󰐊';
                    };
                    self.hook(Mpris, update, 'player-changed');
                    update();
                  },
                  onClicked: () => {
                    const player = findPlayer();
                    if (player) player.playPause();
                  },
                }),
                Button({
                  className: 'txt-norm sec-txt bar-music-button',
                  label: '󰒭',
                  onClicked: () => {
                    const player = findPlayer();
                    if (player) player.next();
                  },
                }),
              ],
            }),
          }),
        ],
      }),
    }),
  });
