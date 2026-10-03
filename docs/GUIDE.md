# Grid Variables

Grid Variables turns a column grid into number variables and a preview frame, for example `xl/col-3` for the width of three columns in a 1440px, 12-column layout. It rounds each column to whole pixels, and shows you whether the grid still matches the width you set.

## Generate a grid

![](grid-variables-form.svg)

1. **Grid**: the **Max width**, the number of **Columns**, the **Margin** on each side and the **Gutter** between columns, in pixels.
2. **Calculated width**: the width of the grid after the plugin rounds the **Column width** to whole pixels. It's green when it equals **Max width**, and red when the rounding changes the width. If it's red, change a value until it's green.
3. **Save to variable collection**: saves the grid in **Collection**, in a group named by **Group**. For `xl`, it writes `xl/viewport` (the calculated width), `xl/columns`, `xl/margin`, `xl/gutter`, and `xl/col-1` to `xl/col-12` for the width of 1 to 12 columns.
4. **Generate preview frame**: draws a frame named after the calculated width, `1440`, with a column layout grid and one bar for each span, from 1 column to 12.

Click **Generate** to create the variables, the frame or both. Press Ctrl/Cmd+Z to undo.

The values go in the collection's default mode. You can use the `col-` variables for width and height only, and the other four don't appear in the variable pickers. With both options selected, the frame's width, padding, gap, layout grid and bars use the new variables.

If the group already exists, the plugin updates its variables in place, so layers that use them keep their bindings. It also deletes every other variable in that group, such as `xl/col-13` from an earlier 16-column grid.

If **Generate** is disabled, select an option, or check that the margin and gutters leave room for the columns. Hover the button to see why. If **Collection** is disabled, the file has no variable collection yet: create one, then open the plugin again.
