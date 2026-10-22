# Aangan — Indian Art New Tab

Aangan is a calm, Indian-inspired Chrome New Tab experience built around hand-drawn line art, delicate botanical details, warm parchment colours, and a spacious layout. It brings a little traditional craftsmanship into a modern browser without making the page feel crowded.

## Design direction

- **Artwork:** hand-drawn Indian-inspired architecture, flowers, foliage, and fine ornamental details.
- **Palette:** parchment cream, ivory, muted terracotta, antique gold, and sepia linework.
- **Layout:** a lightweight top navigation, central clock and greeting, search field, and quick-access shortcuts.
- **Principle:** keep the centre open and readable so the wallpaper remains decorative rather than competing with the controls.

## Features

- Custom New Tab page with matching illustrated background.
- Home, Your Links, and Focus sections.
- Live clock, date, and greeting.
- Search using Google, DuckDuckGo, or Bing.
- Quick-access website shortcuts.
- Focus timer with a short break mode.
- Locally saved preferences where supported by the build.
- Responsive spacing intended to keep key controls visible on typical laptop and desktop screens.

> The exact features available depend on the installed build. Check the extension's settings and interface after loading it.

## Installation

### Install the New Tab extension

1. Download and extract the Aangan New Tab extension ZIP, or locate the project folder.
2. Open Chrome and visit `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted `aangan-new-tab-extension` folder — the folder whose root contains `manifest.json`.
6. Make sure Aangan is enabled, then press **Ctrl + T** to open a new tab.

### Install the matching browser colour theme (optional)

The browser theme is a separate component from the New Tab page.

1. Extract the Aangan Chrome UI theme ZIP.
2. In `chrome://extensions`, click **Load unpacked**.
3. Select the extracted `aangan-chrome-ui-theme` folder containing its `manifest.json`.
4. Disable the older Aangan theme first if it is still installed, so the intended colour palette is applied.

The New Tab extension controls the page content. The Chrome theme controls the native tab strip and browser frame. A regular New Tab extension cannot directly restyle Chrome's real toolbar or tabs.

## Troubleshooting

### Chrome opens the Google New Tab page instead

1. Visit `chrome://extensions` and confirm **Aangan — Indian Art New Tab** is enabled.
2. Click the extension's **Reload** button.
3. Disable any other extension that also replaces the New Tab page.
4. Open a fresh tab with **Ctrl + T**.
5. If it still does not work, open Aangan's **Details** page and review any listed errors.

### The page looks clipped or shows a scrollbar

- Zoom Chrome back to **100%** with `Ctrl + 0`.
- Reload the extension and open a fresh tab.
- Check the page at the browser's normal window size. The layout is designed to adapt, but very short windows may still require scrolling.

### The browser tabs are the wrong colour

- Confirm the separate Aangan Chrome theme is enabled.
- Disable older Aangan themes that may override it.
- Remember that changing the webpage background does not change the native Chrome toolbar.

### A footer appears at the bottom of the page

Chrome may display its own New Tab footer or customisation controls. These are browser UI elements, not part of Aangan's illustrated wallpaper, and their visibility depends on Chrome's version and settings.

## Project structure

A typical unpacked setup contains two separate folders:

```text
Aangan/
├── aangan-new-tab-extension/
│   ├── manifest.json
│   ├── newtab.html
│   └── assets/
│       └── indian-line-art.webp
└── aangan-chrome-ui-theme/
    └── manifest.json
```

Keep each `manifest.json` at the root of its respective folder when loading it unpacked in Chrome.

## Privacy

Aangan is intended to run locally as a browser customisation. Review the permissions declared in the installed `manifest.json` before use. Search queries are sent to the search provider you choose, just as they are when using that provider directly.

## Versioning

Use the version number in each folder's `manifest.json` as the authoritative installed version. The New Tab page and browser theme are separate packages and may have different version numbers.

## License

Add your preferred license before publishing or redistributing this project.
