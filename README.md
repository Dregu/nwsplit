# nwsplit
##### Cross platform speedrunning splitter/timer made for [nw.js](http://github.com/nwjs/nw.js) that also works in the browser.

This was done in a few hours just for fun. Has some cool functions like importing and exporting, autoadding splits, tracking personal bests, gold splits, undo last split, pause, editing on the fly...

Styling can be done live in devtools or with custom css files. Options can be changed in the menu. Global and local hotkeys for reset, pause, stop and split ([CTRL+]F9..F12 by default). All hotkeys have multiple functions: Stopping while already stopped updates splits and best segments with new times. Stopping with no splits adds some empty splits for editing. Holding reset clears everything. Splitting while stopped continues with no time lost. You can edit splits, times and game title by clicking. Splits can be imported as .wsplit or .lss and exported as .wsplit. Double click the splits to export and double click when empty to import, or use the menu. Current session is also autosaved in localStorage forever.

While this is meant for nw.js and should work just fine on windows, linux and mac, it also kinda runs in chrome, firefox, iexplore, safari, android and who knows what. Running in nw.js gives you global hotkeys, menus, borderless resizable window, themes, import, export and maybe more.

##### You can test the basic functions in the [live preview](https://cdn.rawgit.com/Dregu/nwsplit/0911bd39a8ba3bdee36de295cb95090554ccd87b/nwsplit.html) or download [nw.js](http://nwjs.io) and [nwsplit.nw](https://cdn.rawgit.com/Dregu/nwsplit/0911bd39a8ba3bdee36de295cb95090554ccd87b/nwsplit.nw) and run it on your pc.
