# Changelog

## [Unreleased]

### Changed

- **Generate** ends with one notification that counts the variables created, updated and removed in the group, and the frame, with the undo shortcut, in place of "Variables created!" and "Frame generated!"
- A variable whose value and scopes are already right isn't counted as updated, and a run that changes nothing says the variables already match
- **Generate** stays off until you choose a collection for the variables, and its tooltip says what's missing: a grid that fits, an output or a collection. A failure says what to do next instead of pointing to the console

## [1.1.0] - 2026-09-21

### Changed

- Number fields are UI3 numeric inputs: drag the label to scrub, arrow keys step, and they accept arithmetic
- Column sizes (`col-*`) are scoped to width and height; the aliases (margin, gutter, viewport, columns) get no scopes, so they stay out of the variable picker
- The breakpoint name defaults to `xl`
- Built on figma-ui3-kit-svelte 0.6.0, so its controls pick up that release's UI3 fixes

### Fixed

- The two-column fields no longer overflow a narrow plugin window

## [1.0.0] - 2026-05-07

### Added

- Tooltip on disabled Generate button explains why it is disabled ("Fix grid values" or "Select at least one output option")
- Invalid grid configurations (e.g. margins exceeding max width, zero columns) now show `--` in results and disable the Generate button
- No-collections state: when no variable collections exist in the file, the Collection dropdown is disabled with "No collections in this file" and the Group field is hidden

### Changed

- Grid and Output sections now use `<fieldset>`/`<legend>` for proper semantic grouping
- Results section uses `<dl>`/`<dt>`/`<dd>` for semantic term–value pairing, with `aria-live="polite"` so recalculated values are announced to screen readers
- Updated icon imports to use `figma-ui3-kit-svelte/icons` following the UI kit icon export restructure.
- All form inputs have programmatically associated labels (`id`/`for` pairs)
- Collection Dropdown has an accessible label independent of its selected value
- Decorative `<hr>` separators hidden from assistive technology
- Grid calculation extracted into a single `computeGrid()` helper (was duplicated 3×)
- `generate-actions` handler now validates the grid before writing to Figma
- Resize height clamped to a safe range
- Breakpoint string sanitised (trimmed, capped at 64 chars) before use as variable name prefix
- `parseInt` calls use explicit radix 10 throughout

### Fixed

- Generate button now also disabled when grid values produce an invalid layout
- Non-null assertions on Figma variable Map lookups replaced with throwing guards

## [0.9.0] - 2026-04-17

### Changed

- Updated to Figma UI3
- Improved UI labels for clarity
- Grouped output options under "Output" section
- Frame names now use max width value instead of group name
- Group field now only appears when "Save to variable collection" is enabled
- Split success notifications into separate messages for variables and frames

### Added

- Dynamic window resizing: plugin height adjusts when variable options are shown/hidden
- Generate button is now disabled when no output options are selected
