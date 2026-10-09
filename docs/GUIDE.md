# Grid Variables

Grid Variables turns a column grid into number variables and a preview frame, such as `xl/col-3` for three columns of a 1440px, 12-column layout. It rounds columns to whole pixels and shows whether the grid still matches its width.

## Generate a grid

![](grid-variables-form.svg)

1. **Grid** — the grid's sizes in pixels, with **Margin** on each side and **Gutter** between columns.
2. **Calculated width** — the width after **Column width** is rounded to whole pixels. Green means it matches **Max width**. If it's red, adjust a value.
3. **Save to variable collection** — saves the grid in **Collection** under **Group**: for `xl`, `xl/viewport`, `xl/columns`, `xl/margin`, `xl/gutter`, and `xl/col-1` to `xl/col-12`.
4. **Generate preview frame** — draws a frame named after the width, with a column layout grid and a bar for each span.

Click **Generate** to create the variables, the frame, or both. Press Ctrl/Cmd+Z to undo.

The values go in the collection's default mode, and with both options on, the frame uses them. Only width and height pickers list the `col-` variables, and no picker lists the other four. If the group exists, its variables update in place, so bindings stay. Columns the grid no longer has are deleted, such as `xl/col-13` from an earlier 16-column grid. Other variables in the group stay.

If **Generate** is disabled, hover it to see why. If **Collection** is disabled, create a variable collection, then open the plugin again.
