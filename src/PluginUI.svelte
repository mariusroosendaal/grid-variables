<script>
  import {
    Button,
    Checkbox,
    Dropdown,
    Input,
    Label,
    Text,
  } from "figma-ui3-kit-svelte";
  import {
    PluginLayout,
    FieldGroup,
    Footer,
    sendToPlugin,
    createMessageHandler,
  } from "figma-plugin-utils";

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

  $: collectionOptions = collections.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  function calculateGrid() {
    sendToPlugin("calculate-grid", {
      data: {
        maxWidth: parseInt(maxWidth) || 0,
        columns: parseInt(columns) || 0,
        gutter: parseInt(gutter) || 0,
        margin: parseInt(margin) || 0,
      },
    });
  }

  function handleGenerate() {
    sendToPlugin("generate-actions", {
      data: {
        collectionId: selectedCollection?.value || "",
        breakpoint: breakpoint || "default",
        viewport: parseInt(maxWidth) || 0,
        columns: parseInt(columns) || 0,
        margin: parseInt(margin) || 0,
        gutter: parseInt(gutter) || 0,
        generateVariables,
        generateFrame,
      },
    });
  }

  window.onmessage = createMessageHandler({
    "grid-results": (msg) => {
      calculatedWidth = `${msg.data.calculatedPageWidth}px`;
      columnWidth = `${msg.data.columnWidth}px`;
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
    const extraHeight = generateVariables ? 124 : 0;
    sendToPlugin("resize-window", {
      data: { height: baseHeight + extraHeight },
    });
  }
</script>

<div class="plugin-container">
  <PluginLayout>
    <section class="section">
      <Label>Grid</Label>
      <div class="grid-inputs">
        <FieldGroup label="Max width" size="small">
          <Input type="number" bind:value={maxWidth} />
        </FieldGroup>
        <FieldGroup label="Columns" size="small">
          <Input type="number" bind:value={columns} />
        </FieldGroup>
        <FieldGroup label="Margin" size="small">
          <Input type="number" bind:value={margin} />
        </FieldGroup>
        <FieldGroup label="Gutter" size="small">
          <Input type="number" bind:value={gutter} />
        </FieldGroup>
      </div>
    </section>

    <hr />

    <section class="section results">
      <div class="result">
        <Label>Calculated width</Label>
        <Text variant="body-medium" color={resultColor}>
          {calculatedWidth}
        </Text>
      </div>
      <div class="result">
        <Label>Column width</Label>
        <Text variant="body-medium">{columnWidth}</Text>
      </div>
    </section>

    <hr />


    <section class="section">
      <Label>Output</Label>
      
      <Checkbox bind:checked={generateVariables}>
        Save to variable collection
      </Checkbox>

      {#if generateVariables}
        <section class="variables-section">
        <FieldGroup label="Collection">
          <Dropdown
            menuItems={collectionOptions}
            bind:value={selectedCollection}
            placeholder="Select collection"
          />
        </FieldGroup>
        <FieldGroup label="Group">
          <Input bind:value={breakpoint} placeholder="grid/xl" />
        </FieldGroup>
        </section>
      {/if}

      <Checkbox bind:checked={generateFrame}>Generate preview frame</Checkbox>
    </section>
  </PluginLayout>

  <Footer variant="full">
    <Button 
      variant="primary" 
      on:click={handleGenerate} 
      fullWidth
      disabled={!generateVariables && !generateFrame}
    >
      Generate
    </Button>
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
  .variables-section {
    display: flex;
    flex-direction: column;
    gap: var(--size-xsmall);
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

  .result {
    flex: 1;
    display: flex;
    flex-direction: row;
    gap: var(--size-xxxsmall);
  }

  hr {
    border: none;
    border-top: 1px solid var(--figma-color-border);
    margin: 0 -16px;
  }
</style>
