// This file holds the main logic for the plugin.
// It creates variables and generates a Figma frame bound to those variables.

async function initializePlugin() {
	figma.showUI(__html__, { themeColors: true, width: 280, height: 470 });

	try {
		const collections = await figma.variables.getLocalVariableCollectionsAsync();
		const collectionData = collections.map(collection => ({ id: collection.id, name: collection.name }));
		figma.ui.postMessage({ type: 'load-collections', data: collectionData });
	} catch (error) {
		console.error("Error fetching collections:", error);
		figma.notify("Could not load variable collections.", { error: true });
	}
}
initializePlugin();

figma.ui.onmessage = async (msg) => {
	// --- Handle resize from UI ---
	if (msg.type === 'resize') {
		figma.ui.resize(msg.width, msg.height);
		return;
	}

	// --- Grid Calculation (Unchanged) ---
	if (msg.type === 'calculate-grid') {
		const { maxWidth, columns, gutter, margin } = msg.data;
		if (columns <= 0) { figma.ui.postMessage({ type: 'grid-results', data: { calculatedPageWidth: 0, columnWidth: 0, color: 'var(--figma-color-text-danger)' } }); return; }
		const totalGutterWidth = (columns - 1) * gutter;
		const totalMarginWidth = 2 * margin;
		const availableWidthForColumns = maxWidth - totalGutterWidth - totalMarginWidth;
		const rawColumnWidth = availableWidthForColumns / columns;
		const roundedColumnWidth = Math.round(rawColumnWidth);
		const calculatedPageWidth = (roundedColumnWidth * columns) + totalGutterWidth + totalMarginWidth;
		const resultColor = (calculatedPageWidth === maxWidth) ? 'var(--figma-color-text-success)' : 'var(--figma-color-text-danger)';
		figma.ui.postMessage({ type: 'grid-results', data: { calculatedPageWidth, columnWidth: roundedColumnWidth, color: resultColor } });
	}

	// --- Variable & Frame Generation ---
	if (msg.type === 'generate-actions') {
		const { collectionId, breakpoint, viewport: targetMaxWidth, columns, margin, gutter, generateVariables, generateFrame } = msg.data;

		let createdOrUpdatedVariables: Map<string, Variable> | null = null;
		let notificationMessage = '';
		let variablesWereModified = false;

		try {
			// --- ACTION 1: Generate or Update Variables (Conditional) ---
			if (generateVariables) {

				if (!collectionId) {
					figma.notify("Please select a variable collection to proceed.", { error: true });
					return;
				}
				const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
				if (!collection) { throw new Error("Collection not found."); }

				const groupPrefix = `${breakpoint}/`;
				const allVariables = await figma.variables.getLocalVariablesAsync();
				const existingVariablesInGroup = allVariables.filter(v =>
					v.variableCollectionId === collection.id && v.name.startsWith(groupPrefix)
				);

				createdOrUpdatedVariables = new Map<string, Variable>();

				const totalGutterW = (columns - 1) * gutter;
				const totalMarginW = 2 * margin;
				const availableWForCols = targetMaxWidth - totalGutterW - totalMarginW;
				const roundedColWidth = Math.round(availableWForCols / columns);
				const finalCalculatedWidth = (roundedColWidth * columns) + totalGutterW + totalMarginW;
				// 
				// Map of all variables we expect to exist after this operation
				const desiredVariables = new Map<string, number>();
				desiredVariables.set('viewport', finalCalculatedWidth);
				desiredVariables.set('columns', columns);
				desiredVariables.set('margin', margin);
				desiredVariables.set('gutter', gutter);
				for (let i = 1; i <= columns; i++) {
					const spanWidth = (i * roundedColWidth) + ((i - 1) * gutter);
					desiredVariables.set(`col-${i}`, spanWidth);
				}

				const existingVarMap = new Map(existingVariablesInGroup.map(v => [v.name.replace(groupPrefix, ''), v]));

				// --- Sync: Update existing, create new ---
				for (const [name, value] of desiredVariables.entries()) {
					const existingVar = existingVarMap.get(name);
					if (existingVar) {
						// UPDATE: Variable already exists, just update its value. This preserves the ID.
						existingVar.setValueForMode(collection.defaultModeId, value);
						createdOrUpdatedVariables.set(name, existingVar);
					} else {
						// CREATE: Variable doesn't exist, so create it.
						const variableName = `${breakpoint}/${name}`;
						const newVar = figma.variables.createVariable(variableName, collection, 'FLOAT');
						newVar.setValueForMode(collection.defaultModeId, value);
						createdOrUpdatedVariables.set(name, newVar);
					}
				}

				// --- Sync: Delete obsolete variables ---
				// (e.g., if user changes from 12 columns to 8, delete col-9 through col-12)
				for (const [name, variable] of existingVarMap.entries()) {
					if (!desiredVariables.has(name)) {
						variable.remove();
					}
				}

				variablesWereModified = true;
				notificationMessage = existingVariablesInGroup.length > 0 ? '✅ Synced variables!' : '✅ Created variables!';


				// 

			}
			if (generateFrame) {


				const totalGutterW = (columns - 1) * gutter;
				const totalMarginW = 2 * margin;
				const availableWForCols = targetMaxWidth - totalGutterW - totalMarginW;
				const roundedColWidth = Math.round(availableWForCols / columns);
				const finalCalculatedWidth = (roundedColWidth * columns) + totalGutterW + totalMarginW;
				await createGridFrame({
					breakpoint, columns,
					variables: createdOrUpdatedVariables,
					width: finalCalculatedWidth, margin, gutter, roundedColWidth,
				});

				notificationMessage = variablesWereModified ? notificationMessage + ' And generated a frame!' : '✅ Generated a frame!';
			} 

			if (notificationMessage) {
				figma.notify(notificationMessage);
				figma.closePlugin();
			}

		} catch (error) {
			console.error("Error during generation:", error);
			figma.notify("An error occurred. See console for details.", { error: true });
		}
	}
};


async function createGridFrame(params) {
	const { breakpoint, columns, variables, width, margin, gutter, roundedColWidth } = params;

	const frame = figma.createFrame();
	frame.name = `${breakpoint}`;
	frame.layoutMode = 'VERTICAL';
	frame.primaryAxisSizingMode = 'AUTO';

	const gridColor = { r: 0, g: 106 / 255, b: 255 / 255 };
	const fillPaint: SolidPaint = { type: 'SOLID', color: gridColor, opacity: 0.08 };

	if (variables) {
		// BOUND MODE: Use setBoundVariable
		frame.counterAxisSizingMode = 'FIXED';
		frame.setBoundVariable('width', variables.get('viewport'));
		frame.setBoundVariable('paddingLeft', variables.get('margin'));
		frame.setBoundVariable('paddingRight', variables.get('margin'));
		frame.setBoundVariable('paddingTop', variables.get('margin'));
		frame.setBoundVariable('paddingBottom', variables.get('margin'));
		frame.setBoundVariable('itemSpacing', variables.get('gutter'));
	} else {
		// STATIC MODE: Use raw number values
		frame.resize(width, frame.height);
		frame.paddingLeft = margin;
		frame.paddingRight = margin;
		frame.paddingTop = margin;
		frame.paddingBottom = margin;
		frame.itemSpacing = gutter;
	}

	let layoutGrid: RowsColsLayoutGrid;
	if (variables) {
		// BOUND MODE
		layoutGrid = {
			pattern: 'COLUMNS', alignment: 'STRETCH', count: columns, color: { ...gridColor, a: 0.08 },
			gutterSize: variables.get('gutter').resolveForConsumer(frame).value as number,
			offset: variables.get('margin').resolveForConsumer(frame).value as number,
			boundVariables: {
				'gutterSize': figma.variables.createVariableAlias(variables.get('gutter')),
				'offset': figma.variables.createVariableAlias(variables.get('margin')),
				'count': figma.variables.createVariableAlias(variables.get('columns')),
			}
		};
	} else {
		// STATIC MODE
		layoutGrid = {
			pattern: 'COLUMNS', alignment: 'STRETCH', count: columns,
			gutterSize: gutter, offset: margin, color: { ...gridColor, a: 0.08 }
		};
	}
	frame.layoutGrids = [layoutGrid];

	await figma.loadFontAsync({ family: "Inter", style: "Regular" });
	for (let i = 1; i <= columns; i++) {
		const bar = figma.createFrame();
		bar.name = `col-${i}`;
		bar.layoutMode = 'HORIZONTAL';
		bar.primaryAxisAlignItems = 'CENTER';
		bar.counterAxisAlignItems = 'CENTER';
		bar.fills = [fillPaint];
		bar.resize(0, 64);

		if (variables) {
			bar.setBoundVariable('width', variables.get(`col-${i}`));
		} else {
			const spanWidth = (i * roundedColWidth) + ((i - 1) * gutter);
			bar.resize(spanWidth, 64);
		}
		const text = figma.createText();
		text.characters = String(i);
		text.fontSize = 14;
		text.fills = [{ type: 'SOLID', color: gridColor }];
		bar.appendChild(text);
		frame.appendChild(bar);
	}

	figma.currentPage.appendChild(frame);
	figma.currentPage.selection = [frame];
	figma.viewport.scrollAndZoomIntoView([frame]);
}
