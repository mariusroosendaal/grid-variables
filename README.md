# Grid Variables

Generate layout grid variables and preview frames for responsive design systems.

## What it does

Calculates column widths from your grid parameters and creates Figma variables for viewport, columns, margins, gutters, and column spans. Optionally generates a preview frame with the grid bound to those variables.

## Usage

1. Run the plugin
2. Select a variable collection
3. Enter a breakpoint name (e.g., `sm`, `md`, `lg`)
4. Configure grid parameters:
   - Max width / viewport
   - Number of columns
   - Margin and gutter values
5. Choose to generate variables, a frame, or both
6. Click generate

## Output

Variables created (grouped by breakpoint):
- `{breakpoint}/viewport` - Total width
- `{breakpoint}/columns` - Column count
- `{breakpoint}/margin` - Side margins
- `{breakpoint}/gutter` - Gap between columns
- `{breakpoint}/col-1` through `col-{n}` - Span widths

## Development

```bash
npm install
npm run dev    # Watch mode
npm run build  # Production build
```
