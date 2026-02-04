// --- Element References ---
const maxWidthInput = document.getElementById('maxWidth');
const columnsInput = document.getElementById('columns');
const gutterInput = document.getElementById('gutter');
const marginInput = document.getElementById('margin');
const calculatedWidthOutput = document.getElementById('calculatedWidth');
const columnWidthOutput = document.getElementById('columnWidth');
const breakpointInput = document.getElementById('breakpoint');
const collectionSelect = document.getElementById('collectionSelect');
const generateButton = document.getElementById('generateButton');
const generateVariablesCheckbox = document.getElementById('generateVariablesCheckbox');
const generateFrameCheckbox = document.getElementById('generateFrameCheckbox');
const variableOptionsContainer = document.getElementById('variable-options-container');


// --- Event Listeners ---
[maxWidthInput, columnsInput, gutterInput, marginInput].forEach(input => {
  input.oninput = calculateGrid;
});
generateVariablesCheckbox.onchange = toggleVariableOptions;
generateButton.onclick = generateActions;

// --- Message Handling ---
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;

  if (msg.type === 'grid-results') {
    updateResults(msg.data);
  }

  if (msg.type === 'load-collections') {
    populateCollections(msg.data);

  }

};

// --- Functions ---

function toggleVariableOptions() {
  const isChecked = generateVariablesCheckbox.checked;
  variableOptionsContainer.style.display = isChecked ? 'grid' : 'none';
}


function calculateGrid() {
  const data = {
    maxWidth: parseInt(maxWidthInput.value) || 0,
    columns: parseInt(columnsInput.value) || 0,
    gutter: parseInt(gutterInput.value) || 0,
    margin: parseInt(marginInput.value) || 0,
  };
  parent.postMessage({ pluginMessage: { type: 'calculate-grid', data } }, '*');
}

function generateActions() {
  const data = {
    collectionId: collectionSelect.value,
    breakpoint: breakpointInput.value || 'default',
    viewport: parseInt(maxWidthInput.value) || 0,
    columns: parseInt(columnsInput.value) || 0,
    margin: parseInt(marginInput.value) || 0,
    gutter: parseInt(gutterInput.value) || 0,
    generateVariables: generateVariablesCheckbox.checked,
    generateFrame: generateFrameCheckbox.checked,
  };
  parent.postMessage({ pluginMessage: { type: 'generate-actions', data } }, '*');
}

function updateResults(data) {
  calculatedWidthOutput.textContent = `${data.calculatedPageWidth}px`;
  columnWidthOutput.textContent = `${data.columnWidth}px`;
  calculatedWidthOutput.style.color = data.color;
}
function populateCollections(collections) {
  // collectionSelect.innerHTML = '';
  if (collections.length === 0) {
    // const option = document.createElement('option');
    // option.textContent = 'No collections found';
    // option.disabled = true;
    // option.selected = true;
    // collectionSelect.appendChild(option);
  } else {
    // Add a default placeholder option
    // const placeholder = document.createElement('option');
    // placeholder.textContent = 'Select collection';
    // placeholder.value = '';
    // placeholder.disabled = true;
    // placeholder.selected = true;
    // collectionSelect.appendChild(placeholder);
    collections.forEach(collection => {
      const option = document.createElement('option');
      option.value = collection.id;
      option.textContent = collection.name;
      collectionSelect.appendChild(option);
    });
  } 
  selectMenu.init()
}

calculateGrid();
toggleVariableOptions();