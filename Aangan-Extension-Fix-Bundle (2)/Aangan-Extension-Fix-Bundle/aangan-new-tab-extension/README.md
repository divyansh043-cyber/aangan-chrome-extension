# Aangan — Indian Art New Tab (repair build 1.0.1)

This extension supplies Aangan's wallpaper, clock, search field, shortcuts, and Home / Your links / Focus tabs. The CSS is tightened for typical laptop and desktop new-tab viewports to reduce clipping and unwanted vertical scrolling.

## Restore Aangan when Chrome shows the Google New Tab page

The Google logo, search box, and Chrome-style shortcuts in the current screenshot mean Chrome is showing its built-in New Tab page instead of `newtab.html` from Aangan. The browser colour theme is separate; it does not supply Aangan's custom page layout.

1. Open `chrome://extensions`.
2. Find **Aangan — Indian Art New Tab** and make sure its switch is **On**.
3. Click that extension's circular **Reload** icon. If you do not see Aangan in the list, use **Load unpacked** and select the `aangan-new-tab-extension` folder (the folder containing `manifest.json`).
4. If another extension also replaces New Tab, disable that competing extension. Chrome allows only one active New Tab override; reloading/enabling Aangan after the competing extension should restore Aangan.
5. Press `Ctrl+T` to open a fresh tab.

If Chrome still shows the Google page, open Aangan's **Details** and check for an **Errors** section. Also make sure you are not using an Incognito window, where New Tab overrides do not apply.

## Apply the matching Chrome toolbar colours

The separate `aangan-chrome-ui-theme` folder changes the native tab strip, toolbar, and address-bar colours. Load that folder through `chrome://extensions` → **Developer mode** → **Load unpacked**. Keep Aangan enabled as well. To preserve Aangan's own content layout, the Aangan New Tab extension must be the active New Tab override.

## Features

- Traditional Indian hand-drawn wallpaper and parchment UI
- Home, Your links, and Focus sections
- Search via Google, DuckDuckGo, or Bing
- Editable shortcuts, display name, and clock setting
- Focus / break timer
- Preferences saved locally with Chrome storage
- No remote libraries or tracking
