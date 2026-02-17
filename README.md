# Grid Variables

Generate layout grid variables and preview frames for responsive design systems.

## What it does

Calculates column widths from your grid parameters and creates Figma variables for viewport, columns, margins, gutters, and column spans. Optionally generates a preview frame with the grid bound to those variables.

The plugin automatically rounds column widths to whole pixels and shows whether your grid parameters result in pixel-perfect dimensions. The calculated width indicator turns green when your max width matches the rounded result, or red when rounding causes a mismatch.

## Usage

1. Run the plugin
2. Configure grid parameters:
   - Max width / viewport
   - Number of columns
   - Margin and gutter values
3. Choose output options:
   - **Save to variable collection** - Creates/updates variables in a selected collection with a group prefix (e.g., `grid/xl`)
   - **Generate preview frame** - Creates a frame showing the grid layout
4. If saving variables, select a collection and enter a group name
5. Click Generate

## Output

**Variables** (grouped by your chosen name):
- `{group}/viewport` - Total width
- `{group}/columns` - Column count
- `{group}/margin` - Side margins
- `{group}/gutter` - Gap between columns
- `{group}/col-1` through `col-{n}` - Span widths for each column span

**Preview frame** - Named with the max width value (e.g., "1440"), with column layout and grid overlay bound to variables if generated together

## Development

```bash
npm install
npm run dev    # Watch mode
npm run build  # Production build
```
