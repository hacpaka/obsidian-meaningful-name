# Changelog

Notable changes per release. The release workflow publishes the section matching
the released version as the GitHub Release notes, then appends a "Full Changelog"
compare link. Headings must be `## X.Y.Z` (the version, no `v`) so CI can find them.

At release time, rename `## Unreleased` to the version being released.

Meaningful Name starts at 1.0.0. The 4.x and older sections are releases of the original
[Front Matter Title](https://github.com/snezhig/obsidian-front-matter-title), kept for history.

## 1.0.2

Requires Obsidian 1.13 or newer.

### Changed
- The settings page is rebuilt on Obsidian's new settings API, so every option shows up in Obsidian's settings
  search. Features are switched on and off in one list; each enabled feature has its own page under
  **Feature settings** with its options and templates, replacing the **Manage** pop-up.
- The JavaScript processor modes (**Function** and **Function V2**) are removed: running code typed into
  settings is something the Obsidian plugin review asks plugins to avoid. If one was selected, the processor
  is switched off when you update. **Replace** (regular expressions) stays.

### Fixed
- Errors in background updates (settings changes, aliases, note links, tabs, the "what's new" notes) are now
  logged to the console instead of being lost, and a feature that fails to start shows its error message.

### Under the hood
- The code is cleaned up for the Obsidian plugin review: no `any`, no unsafe values, no unhandled promises, no
  direct styles or `innerHTML`.
- The API types from Snezhig's `front-matter-plugin-api-provider` are included in
  `src/Components/ApiAdapter/Contracts.ts` (ISC, credited) instead of a git submodule. The README no longer
  points to that provider: it looks for the original plugin's id and cannot find Meaningful Name.
- `builtin-modules` is replaced by Node's own module list, the screenshot tool has its own tsconfig, and unit
  tests get `window` from a small custom Jest environment (`test/environment.ts`).

## 1.0.1

### Fixed
- The plugin no longer sets inline styles to hide the original title. It uses a CSS class from the new
  `styles.css`, as the Obsidian plugin review requires. Releases now ship `styles.css` next to `main.js` and
  `manifest.json`.

## 1.0.0

### Changed
- Forked from [Front Matter Title](https://github.com/snezhig/obsidian-front-matter-title) 4.2.1 by Snezhig and
  renamed to **Meaningful Name**. The plugin id is now `meaningful-name`, so it installs separately and does not
  pick up the original's settings or hotkeys.
- The default common main template is now `name` instead of `title`.
- `package.json` now declares GPL-3.0, the license in `LICENSE`, instead of MIT.

## 4.2.0

### Added
- New `#h1` to `#h6` template placeholders take the first heading of that exact level.
  For example, `#h1` uses only the H1 and falls back when the note has none. `#heading`
  still takes the first heading of any level (#286).

### Fixed
- The note title no longer disappears when an image (or any other file) is added to the
  vault while a note is open. Adding a file made the plugin drop the title of every open
  note and leave nothing in its place until a reload (#285).

## 4.1.1

### Fixed
- The note title and the file name no longer appear together at the top of a note. This
  happened with themes that style the inline title, such as anuPpuccin. Now only the note
  title is shown (#280, #234, #123).

## 4.1.0

### Added
- Note titles now also show under "Unlinked mentions" in the backlinks panel (#190).

### Fixed
- Files added from outside Obsidian (e.g. via sync) now get their title in the file
  explorer right away, without needing a reload (#250).
- Bookmarked files placed inside a group now show their title (#257).
- Composite templates now work with non-Latin frontmatter keys, such as Chinese (#256).
- Tab titles are no longer lost when switching between tabs (#248, #277).
- Fixed a crash that could leave the interface blank after switching a workspace that has
  pinned tabs (#251).

### Changed
- The "loading" notifications on startup now only appear in Debug mode (#270).

## 4.0.0

### Added
- After the plugin updates, a short note pops up explaining what changed and where the
  project stands.

### Fixed
- Sorting the file explorer by created or modified date works again. Before, turning the
  plugin on left you stuck with name sorting only (#262).

### Changed
- The plugin is more robust when Obsidian updates. If a new Obsidian version changes
  something a feature depends on, only that one feature turns off (with a short notice)
  instead of the whole plugin breaking or showing a blank screen (#233, #251).

### Internal
- Added a Docker-based dev/test setup and end-to-end tests that run against a real Obsidian,
  fixed a build error, and fixed cloning the plugin's submodule (#273).
