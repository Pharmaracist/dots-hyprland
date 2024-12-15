#!/usr/bin/env python3
import gi
gi.require_version('Playerctl', '2.0')
from gi.repository import Playerctl, GLib
import dbus
import dbus.service
from dbus.mainloop.glib import DBusGMainLoop
import json
import sys
import os

MPRIS_INTERFACE = 'org.mpris.MediaPlayer2'
MPRIS_PLAYER_INTERFACE = 'org.mpris.MediaPlayer2.Player'
MPRIS_PATH = '/org/mpris/MediaPlayer2'

class YTMusicPlayer(dbus.service.Object):
    def __init__(self):
        bus_name = dbus.service.BusName(
            'org.mpris.MediaPlayer2.ytmusic',
            bus=dbus.SessionBus()
        )
        super().__init__(bus_name, MPRIS_PATH)
        
        self._metadata = {}
        self._playback_status = 'Stopped'
        
    @dbus.service.method(MPRIS_INTERFACE)
    def Raise(self):
        pass

    @dbus.service.method(MPRIS_INTERFACE)
    def Quit(self):
        pass

    @dbus.service.method(MPRIS_PLAYER_INTERFACE)
    def Next(self):
        pass

    @dbus.service.method(MPRIS_PLAYER_INTERFACE)
    def Previous(self):
        pass

    @dbus.service.method(MPRIS_PLAYER_INTERFACE)
    def Pause(self):
        self._playback_status = 'Paused'
        self.PropertiesChanged(MPRIS_PLAYER_INTERFACE, 
            {'PlaybackStatus': self._playback_status}, [])

    @dbus.service.method(MPRIS_PLAYER_INTERFACE)
    def PlayPause(self):
        self._playback_status = 'Playing' if self._playback_status != 'Playing' else 'Paused'
        self.PropertiesChanged(MPRIS_PLAYER_INTERFACE, 
            {'PlaybackStatus': self._playback_status}, [])

    @dbus.service.method(MPRIS_PLAYER_INTERFACE)
    def Stop(self):
        self._playback_status = 'Stopped'
        self.PropertiesChanged(MPRIS_PLAYER_INTERFACE, 
            {'PlaybackStatus': self._playback_status}, [])

    @dbus.service.method(MPRIS_PLAYER_INTERFACE)
    def Play(self):
        self._playback_status = 'Playing'
        self.PropertiesChanged(MPRIS_PLAYER_INTERFACE, 
            {'PlaybackStatus': self._playback_status}, [])

    @dbus.service.method(MPRIS_INTERFACE, in_signature='', out_signature='a{sv}')
    def GetAll(self, interface):
        if interface == MPRIS_PLAYER_INTERFACE:
            return {
                'PlaybackStatus': self._playback_status,
                'Metadata': dbus.Dictionary(self._metadata, signature='sv'),
                'CanGoNext': False,
                'CanGoPrevious': False,
                'CanPlay': True,
                'CanPause': True,
                'CanSeek': False,
                'CanControl': True
            }
        return {}

    @dbus.service.signal(dbus.PROPERTIES_IFACE, signature='sa{sv}as')
    def PropertiesChanged(self, interface, changed_properties, invalidated_properties):
        pass

    def update_metadata(self, metadata):
        self._metadata = {
            'xesam:title': metadata.get('title', ''),
            'xesam:artist': [metadata.get('artist', '')],
            'xesam:album': metadata.get('album', ''),
            'mpris:artUrl': metadata.get('artUrl', ''),
            'mpris:trackid': dbus.ObjectPath(
                f'/org/mpris/MediaPlayer2/track/{metadata.get("trackId", "0")}'
            )
        }
        self.PropertiesChanged(MPRIS_PLAYER_INTERFACE, 
            {'Metadata': dbus.Dictionary(self._metadata, signature='sv')}, [])

def main():
    DBusGMainLoop(set_as_default=True)
    player = YTMusicPlayer()
    
    # Read commands from stdin
    def handle_input():
        line = sys.stdin.readline()
        if not line:
            return False
            
        try:
            command = json.loads(line)
            if command['type'] == 'metadata':
                player.update_metadata(command['data'])
            elif command['type'] == 'playback':
                if command['data'] == 'play':
                    player.Play()
                elif command['data'] == 'pause':
                    player.Pause()
                elif command['data'] == 'stop':
                    player.Stop()
        except json.JSONDecodeError:
            pass
        except KeyError:
            pass
            
        return True

    GLib.io_add_watch(sys.stdin, GLib.IO_IN, lambda *args: handle_input())
    
    loop = GLib.MainLoop()
    loop.run()

if __name__ == '__main__':
    main()
