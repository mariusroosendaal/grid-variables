import {
  showError,
  showNotice,
  showSuccess,
} from "figma-plugin-utilities/lib/figma-helpers";
import { joinList, plural, UNDO } from "figma-plugin-utilities/lib/format";
interface GridMetrics {
  roundedColWidth: number;
  calculatedPageWidth: number;
  isValid: boolean;
}

function computeGrid(
  maxWidth: number,
  columns: number,
  gutter: number,
  margin: number,
): GridMetrics {
  if (columns <= 0 || maxWidth <= 0) {
    return { roundedColWidth: 0, calculatedPageWidth: 0, isValid: false };
  }
  const totalGutterWidth = (columns - 1) * gutter;
  const totalMarginWidth = 2 * margin;
  const availableWidth = maxWidth - totalGutterWidth - totalMarginWidth;
  const roundedColWidth = Math.round(availableWidth / columns);
  if (roundedColWidth <= 0) {
    return { roundedColWidth: 0, calculatedPageWidth: 0, isValid: false };
  }
  const calculatedPageWidth =
    roundedColWidth * columns + totalGutterWidth + totalMarginWidth;
  return { roundedColWidth, calculatedPageWidth, isValid: true };
}

// Aliases only (margin, gutter, viewport, columns) get no scopes so they stay
// out of the variable picker; col-* sizes are only ever used for width/height.
function scopesFor(name: string): VariableScope[] {
  return name.startsWith("col-") ? ["WIDTH_HEIGHT"] : [];
}

function getVar(variables: Map<string, Variable>, key: string): Variable {
  const v = variables.get(key);
  if (!v) throw new Error(`Missing variable: ${key}`);
  return v;
}

async function initializePlugin() {
  figma.showUI(__html__, { themeColors: true, width: 240, height: 380 });

  try {
    const collections =
      await figma.variables.getLocalVariableCollectionsAsync();
    const collectionData = collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
    }));
    figma.ui.postMessage({ type: "load-collections", data: collectionData });
  } catch (error) {
    console.error("Error fetching collections:", error);
    showError(
      "Couldn't read the variable collections. Reopen the plugin to try again.",
    );
  }
}
initializePlugin();

figma.ui.onmessage = async (msg) => {
  if (msg.type === "resize-window") {
    const height = Math.max(
      100,
      Math.min(2000, Number(msg.data.height) || 380),
    );
    figma.ui.resize(240, height);
    return;
  }

  if (msg.type === "calculate-grid") {
    const { maxWidth, columns, gutter, margin } = msg.data;
    const grid = computeGrid(maxWidth, columns, gutter, margin);
    if (!grid.isValid) {
      figma.ui.postMessage({
        type: "grid-results",
        data: {
          calculatedPageWidth: 0,
          columnWidth: 0,
          color: "var(--figma-color-text-danger)",
          isValid: false,
        },
      });
      return;
    }
    const resultColor =
      grid.calculatedPageWidth === maxWidth
        ? "var(--figma-color-text-success)"
        : "var(--figma-color-text-danger)";
    figma.ui.postMessage({
      type: "grid-results",
      data: {
        calculatedPageWidth: grid.calculatedPageWidth,
        columnWidth: grid.roundedColWidth,
        color: resultColor,
        isValid: true,
      },
    });
  }

  if (msg.type === "generate-actions") {
    const {
      collectionId,
      breakpoint,
      viewport: targetMaxWidth,
      columns,
      margin,
      gutter,
      generateVariables,
      generateFrame,
    } = msg.data;

    const grid = computeGrid(targetMaxWidth, columns, gutter, margin);
    if (!grid.isValid) {
      showError(
        "The grid doesn't fit. Check the max width, columns, margin and gutter.",
      );
      return;
    }

    const sanitizedBreakpoint =
      String(breakpoint || "")
        .trim()
        .slice(0, 64) || "default";

    let createdOrUpdatedVariables: Map<string, Variable> | null = null;
    // What the run did, for its one notification.
    const done: string[] = [];
    // Set when the variables were already up to date.
    let unchanged = "";

    try {
      if (generateVariables) {
        if (!collectionId) {
          showNotice("Choose a collection, then generate.");
          return;
        }
        const collection =
          await figma.variables.getVariableCollectionByIdAsync(collectionId);
        if (!collection) {
          throw new Error("Collection not found.");
        }

        const groupPrefix = `${sanitizedBreakpoint}/`;
        const allVariables = await figma.variables.getLocalVariablesAsync();
        const existingVariablesInGroup = allVariables.filter(
          (v) =>
            v.variableCollectionId === collection.id &&
            v.name.startsWith(groupPrefix),
        );

        createdOrUpdatedVariables = new Map<string, Variable>();
        let created = 0;
        let updated = 0;
        let removed = 0;

        const desiredVariables = new Map<string, number>();
        desiredVariables.set("viewport", grid.calculatedPageWidth);
        desiredVariables.set("columns", columns);
        desiredVariables.set("margin", margin);
        desiredVariables.set("gutter", gutter);
        for (let i = 1; i <= columns; i++) {
          desiredVariables.set(
            `col-${i}`,
            i * grid.roundedColWidth + (i - 1) * gutter,
          );
        }

        const existingVarMap = new Map(
          existingVariablesInGroup.map((v) => [
            v.name.replace(groupPrefix, ""),
            v,
          ]),
        );

        for (const [name, value] of desiredVariables.entries()) {
          const existingVar = existingVarMap.get(name);
          if (existingVar) {
            const scopes = scopesFor(name);
            // A rerun with the same values changes nothing, and says so.
            if (
              existingVar.valuesByMode[collection.defaultModeId] !== value ||
              existingVar.scopes.length !== scopes.length ||
              existingVar.scopes.some((scope) => !scopes.includes(scope))
            ) {
              existingVar.setValueForMode(collection.defaultModeId, value);
              existingVar.scopes = scopes;
              updated++;
            }
            createdOrUpdatedVariables.set(name, existingVar);
          } else {
            const newVar = figma.variables.createVariable(
              `${sanitizedBreakpoint}/${name}`,
              collection,
              "FLOAT",
            );
            newVar.setValueForMode(collection.defaultModeId, value);
            newVar.scopes = scopesFor(name);
            createdOrUpdatedVariables.set(name, newVar);
            created++;
          }
        }

        for (const [name, variable] of existingVarMap.entries()) {
          if (!desiredVariables.has(name)) {
            variable.remove();
            removed++;
          }
        }

        if (created > 0) done.push(`created ${plural(created, "variable")}`);
        if (updated > 0) done.push(`updated ${plural(updated, "variable")}`);
        if (removed > 0) done.push(`removed ${plural(removed, "variable")}`);
        if (done.length > 0)
          done[done.length - 1] += ` in "${sanitizedBreakpoint}"`;
        else
          unchanged = `the variables in "${sanitizedBreakpoint}" already match`;
      }

      if (generateFrame) {
        await createGridFrame({
          columns,
          variables: createdOrUpdatedVariables,
          width: grid.calculatedPageWidth,
          margin,
          gutter,
          roundedColWidth: grid.roundedColWidth,
        });
        done.push("created the grid frame");
      }
    } catch (error) {
      console.error("Error during generation:", error);
      showError(
        "Couldn't generate the grid. Press Ctrl/Cmd+Z to undo anything half-made, then try again.",
      );
      return;
    }

    if (done.length > 0) {
      const summary = joinList(done);
      const note = unchanged
        ? ` ${unchanged[0].toUpperCase()}${unchanged.slice(1)}.`
        : "";
      showSuccess(
        `${summary[0].toUpperCase()}${summary.slice(1)}.${note} ${UNDO}`,
      );
    } else if (unchanged) {
      showNotice(`Nothing to update: ${unchanged}.`);
    }
  }
};

interface GridFrameParams {
  columns: number;
  variables: Map<string, Variable> | null;
  width: number;
  margin: number;
  gutter: number;
  roundedColWidth: number;
}

async function createGridFrame(params: GridFrameParams) {
  const { columns, variables, width, margin, gutter, roundedColWidth } = params;

  const frame = figma.createFrame();
  frame.name = `${width}`;
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";

  const gridColor = { r: 0, g: 106 / 255, b: 255 / 255 };
  const fillPaint: SolidPaint = {
    type: "SOLID",
    color: gridColor,
    opacity: 0.08,
  };

  if (variables) {
    frame.counterAxisSizingMode = "FIXED";
    frame.setBoundVariable("width", getVar(variables, "viewport"));
    frame.setBoundVariable("paddingLeft", getVar(variables, "margin"));
    frame.setBoundVariable("paddingRight", getVar(variables, "margin"));
    frame.setBoundVariable("paddingTop", getVar(variables, "margin"));
    frame.setBoundVariable("paddingBottom", getVar(variables, "margin"));
    frame.setBoundVariable("itemSpacing", getVar(variables, "gutter"));
  } else {
    frame.resize(width, frame.height);
    frame.paddingLeft = margin;
    frame.paddingRight = margin;
    frame.paddingTop = margin;
    frame.paddingBottom = margin;
    frame.itemSpacing = gutter;
  }

  let layoutGrid: RowsColsLayoutGrid;
  if (variables) {
    layoutGrid = {
      pattern: "COLUMNS",
      alignment: "STRETCH",
      count: columns,
      color: { ...gridColor, a: 0.08 },
      gutterSize: getVar(variables, "gutter").resolveForConsumer(frame)
        .value as number,
      offset: getVar(variables, "margin").resolveForConsumer(frame)
        .value as number,
      boundVariables: {
        gutterSize: figma.variables.createVariableAlias(
          getVar(variables, "gutter"),
        ),
        offset: figma.variables.createVariableAlias(
          getVar(variables, "margin"),
        ),
        count: figma.variables.createVariableAlias(
          getVar(variables, "columns"),
        ),
      },
    };
  } else {
    layoutGrid = {
      pattern: "COLUMNS",
      alignment: "STRETCH",
      count: columns,
      gutterSize: gutter,
      offset: margin,
      color: { ...gridColor, a: 0.08 },
    };
  }
  frame.layoutGrids = [layoutGrid];

  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  for (let i = 1; i <= columns; i++) {
    const bar = figma.createFrame();
    bar.name = `col-${i}`;
    bar.layoutMode = "HORIZONTAL";
    bar.primaryAxisAlignItems = "CENTER";
    bar.counterAxisAlignItems = "CENTER";
    bar.fills = [fillPaint];
    bar.resize(0, 64);

    if (variables) {
      bar.setBoundVariable("width", getVar(variables, `col-${i}`));
    } else {
      bar.resize(i * roundedColWidth + (i - 1) * gutter, 64);
    }

    const text = figma.createText();
    text.characters = String(i);
    text.fontSize = 14;
    text.fills = [{ type: "SOLID", color: gridColor }];
    bar.appendChild(text);
    frame.appendChild(bar);
  }

  figma.currentPage.appendChild(frame);
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);
}
