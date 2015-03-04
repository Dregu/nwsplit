# nwsplit
##### Cross platform speedrunning splitter/timer made for [nw.js](http://github.com/nwjs/nw.js) that runs on windows, linux and mac, and also in the browser and mobile devices.

##### You can test the basic functions in the [live preview](https://cdn.rawgit.com/Dregu/nwsplit/de158226ba743d31ad7a069d31d8a3acd806e9be/nwsplit.html) or download [nw.js](http://nwjs.io) and [nwsplit.nw](https://cdn.rawgit.com/Dregu/nwsplit/de158226ba743d31ad7a069d31d8a3acd806e9be/nwsplit.nw) and run it on your pc.

This was done in a few hours just for fun. Has some cool functions like importing and exporting, autoadding splits, tracking personal bests, gold splits, undo, pause, editing on the fly...

Styling can be done live in devtools or with custom css files. Options can be changed in the menu. Global and local hotkeys for reset, pause, stop and split ([CTRL+]F9..F12 by default). All hotkeys have multiple functions: Stopping while already stopped updates splits and best segments with new records (hold to add all times.)  Stopping with no splits adds some empty splits for editing. Holding reset clears everything. Splitting while stopped continues with no time lost. You can edit splits, times and game title by clicking. Splits can be imported and exported as .wsplit. Double click the splits to export and double click when empty to import, or use the menu. Current session is also autosaved in localStorage forever.

While this is meant for nw.js where it should work on windows, linux and mac, it also runs in chrome, firefox, internet explorer, safari, chrome for android, firefox mobile... On mobile it even works in the background. Running in nw.js gives you global hotkeys, menus, borderless resizable window, themes, and propably some other features.

You can also send javascript commands to the unix socket at /tmp/nwsplit.sock if using nw.js on linux/mac. Supported commands are split(), stop(), pause(), reset(), trash() and everything else you find in the source. Example: `$ echo "split()" | nc -U /tmp/nwsplit.sock`. This way you can bind your own hotkeys for any window manager.
