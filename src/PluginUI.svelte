<script>
  import {
    Button,
    Checkbox,
    Dropdown,
    Input,
    Text,
    Tooltip,
  } from "figma-ui3-kit-svelte";
  import {
    PluginLayout,
    FieldGroup,
    Footer,
    sendToPlugin,
    createMessageHandler,
  } from "figma-plugin-utilities";

  // Inputs
  let maxWidth = "1440";
  let columns = "12";
  let margin = "24";
  let gutter = "24";
  let breakpoint = "grid/xl";

  // Options
  let generateVariables = false;
  let generateFrame = false;
  let collections = [];
  let selectedCollection = null;

  // Results
  let calculatedWidth = "--";
  let columnWidth = "--";
  let resultColor = "";
  let gridIsValid = true;

  $: hasCollections = collections.length > 0;
  $: collectionOptions = collections.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  function calculateGrid() {
    sendToPlugin("calculate-grid", {
      data: {
        maxWidth: parseInt(maxWidth, 10) || 0,
        columns: parseInt(columns, 10) || 0,
        gutter: parseInt(gutter, 10) || 0,
        margin: parseInt(margin, 10) || 0,
      },
    });
  }

  function handleGenerate() {
    sendToPlugin("generate-actions", {
      data: {
        collectionId: selectedCollection?.value || "",
        breakpoint: breakpoint || "default",
        viewport: parseInt(maxWidth, 10) || 0,
        columns: parseInt(columns, 10) || 0,
        margin: parseInt(margin, 10) || 0,
        gutter: parseInt(gutter, 10) || 0,
        generateVariables,
        generateFrame,
      },
    });
  }

  $: generateDisabled = (!generateVariables && !generateFrame) || !gridIsValid;
  $: tooltipLabel = !gridIsValid
    ? "Fix grid values before generating"
    : "Select at least one output option to enable";

  window.onmessage = createMessageHandler({
    "grid-results": (msg) => {
      gridIsValid = msg.data.isValid !== false;
      if (gridIsValid) {
        calculatedWidth = `${msg.data.calculatedPageWidth}px`;
        columnWidth = `${msg.data.columnWidth}px`;
      } else {
        calculatedWidth = "--";
        columnWidth = "--";
      }
      resultColor = msg.data.color || "";
    },
    "load-collections": (msg) => {
      collections = msg.data || [];
      if (collections.length > 0) {
        selectedCollection = {
          label: collections[0].name,
          value: collections[0].id,
        };
      }
    },
  });

  // Calculate on mount and when inputs change
  $: if (maxWidth || columns || gutter || margin) {
    calculateGrid();
  }

  // Resize plugin window when variables section expands/collapses
  $: {
    const baseHeight = 375;
    const extraHeight = generateVariables ? 104 : 0;
    sendToPlugin("resize-window", {
      data: { height: baseHeight + extraHeight },
    });
  }
</script>

<div class="plugin-container">
  <PluginLayout>
    <fieldset class="section">
      <Text as="legend" variant="body-medium">Grid</Text>
      <div class="grid-inputs">
        <FieldGroup label="Max width" size="small" labelFor="input-max-width">
          <Input type="number" bind:value={maxWidth} id="input-max-width" />
        </FieldGroup>
        <FieldGroup label="Columns" size="small" labelFor="input-columns">
          <Input type="number" bind:value={columns} id="input-columns" />
        </FieldGroup>
        <FieldGroup label="Margin" size="small" labelFor="input-margin">
          <Input type="number" bind:value={margin} id="input-margin" />
        </FieldGroup>
        <FieldGroup label="Gutter" size="small" labelFor="input-gutter">
          <Input type="number" bind:value={gutter} id="input-gutter" />
        </FieldGroup>
      </div>
    </fieldset>

    <hr aria-hidden="true" />

    <section
      class="section results"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Grid calculation results"
    >
      <dl class="results-list">
        <div class="result">
          <dt><Text variant="body-medium">Calculated width</Text></dt>
          <dd><Text variant="body-medium" color={resultColor || '--figma-color-text'}>{calculatedWidth}</Text></dd>
        </div>
        <div class="result">
          <dt><Text variant="body-medium">Column width</Text></dt>
          <dd><Text variant="body-medium">{columnWidth}</Text></dd>
        </div>
      </dl>
    </section>

    <hr aria-hidden="true" />

    <fieldset class="section">
      <Text as="legend" variant="body-medium">Output</Text>

      <Checkbox bind:checked={generateVariables}>
        Save to variable collection
      </Checkbox>

      {#if generateVariables}
        <div class="section variables-section">
          <FieldGroup label="Collection" size="small" labelFor="input-collection">
            <Dropdown
              menuItems={collectionOptions}
              bind:value={selectedCollection}
              placeholder={hasCollections ? "Select collection" : "No collections in this file"}
              disabled={!hasCollections}
              ariaLabel="Variable collection"
            />
          </FieldGroup>
          {#if hasCollections}
            <FieldGroup label="Group" size="small" labelFor="input-group">
              <Input bind:value={breakpoint} placeholder="grid/xl" id="input-group" />
            </FieldGroup>
          {/if}
        </div>
      {/if}

      <Checkbox bind:checked={generateFrame}>Generate preview frame</Checkbox>
    </fieldset>
  </PluginLayout>

  <Footer variant="full">
    <Tooltip
      label={tooltipLabel}
      direction="Top"
      disabled={!generateDisabled}
    >
      <Button
        variant="primary"
        on:click={handleGenerate}
        fullWidth
        disabled={generateDisabled}
      >
        Generate
      </Button>
    </Tooltip>
  </Footer>
</div>

<style>
  .plugin-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--size-xxsmall);
  }

  fieldset.section {
    border: none;
    padding: 0;
    margin: 0;
  }

  fieldset.section :global(legend) {
    padding: 0;
    margin-bottom: var(--size-xxsmall);
  }

  .variables-section {
    margin-bottom: var(--size-xxxsmall);
  }

  .grid-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--size-xxsmall);
  }

  .results {
    flex-direction: column;
    gap: var(--size-xxsmall);
  }

  .results-list {
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--size-xxsmall);
  }

  .result {
    flex: 1;
    display: flex;
    flex-direction: row;
    gap: var(--size-xxxsmall);
  }

  .result dd {
    margin: 0 0 0 auto;
  }

  hr {
    border: none;
    border-top: 1px solid var(--figma-color-border);
    margin: 0 -16px;
  }
</style>
