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
    figma.notify("Could not load variable collections.", { error: true });
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
      figma.notify("Invalid grid — check your values.", { error: true });
      return;
    }

    const sanitizedBreakpoint =
      String(breakpoint || "")
        .trim()
        .slice(0, 64) || "default";

    let createdOrUpdatedVariables: Map<string, Variable> | null = null;

    try {
      if (generateVariables) {
        if (!collectionId) {
          figma.notify("Please select a variable collection to proceed.", {
            error: true,
          });
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
            existingVar.setValueForMode(collection.defaultModeId, value);
            createdOrUpdatedVariables.set(name, existingVar);
          } else {
            const newVar = figma.variables.createVariable(
              `${sanitizedBreakpoint}/${name}`,
              collection,
              "FLOAT",
            );
            newVar.setValueForMode(collection.defaultModeId, value);
            createdOrUpdatedVariables.set(name, newVar);
          }
        }

        for (const [name, variable] of existingVarMap.entries()) {
          if (!desiredVariables.has(name)) {
            variable.remove();
          }
        }

        figma.notify(
          existingVariablesInGroup.length > 0
            ? "Variables synced!"
            : "Variables created!",
        );
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
        figma.notify("Frame generated!");
      }
    } catch (error) {
      console.error("Error during generation:", error);
      figma.notify("An error occurred. See console for details.", {
        error: true,
      });
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
