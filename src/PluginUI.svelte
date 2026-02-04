<script>
  import {
    Button,
    Checkbox,
    Dropdown,
    Input,
    Label,
    Text,
  } from "figma-ui3-kit-svelte";

  // Inputs
  let maxWidth = "1366";
  let columns = "12";
  let margin = "32";
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
    parent.postMessage(
      {
        pluginMessage: {
          type: "calculate-grid",
          data: {
            maxWidth: parseInt(maxWidth) || 0,
            columns: parseInt(columns) || 0,
            gutter: parseInt(gutter) || 0,
            margin: parseInt(margin) || 0,
          },
        },
      },
      "*",
    );
  }

  function handleGenerate() {
    parent.postMessage(
      {
        pluginMessage: {
          type: "generate-actions",
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
        },
      },
      "*",
    );
  }

  window.onmessage = (event) => {
    const msg = event.data?.pluginMessage;
    if (!msg) return;

    if (msg.type === "grid-results") {
      calculatedWidth = `${msg.data.calculatedPageWidth}px`;
      columnWidth = `${msg.data.columnWidth}px`;
      resultColor = msg.data.color || "";
    }

    if (msg.type === "load-collections") {
      collections = msg.data || [];
      if (collections.length > 0) {
        selectedCollection = {
          label: collections[0].name,
          value: collections[0].id,
        };
      }
    }
  };

  // Calculate on mount and when inputs change
  $: if (maxWidth || columns || gutter || margin) {
    calculateGrid();
  }
</script>

<div class="wrapper">
  <div class="main">
    <section class="section">
      <div class="grid-inputs">
        <div class="field">
          <Label>Max width (px)</Label>
          <Input type="number" bind:value={maxWidth} />
        </div>
        <div class="field">
          <Label>Columns</Label>
          <Input type="number" bind:value={columns} />
        </div>
        <div class="field">
          <Label>Margin (px)</Label>
          <Input type="number" bind:value={margin} />
        </div>
        <div class="field">
          <Label>Gutter (px)</Label>
          <Input type="number" bind:value={gutter} />
        </div>
      </div>
    </section>

    <hr />

    <section class="section results">
      <div class="result">
        <Label>Calculated width</Label>
        <Text variant="body-medium" style="color: {resultColor}">
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
      <div class="field">
        <Label>Breakpoint/Group</Label>
        <Input bind:value={breakpoint} placeholder="grid/xl" />
      </div>

      <Checkbox bind:checked={generateVariables}>
        Generate/update variables
      </Checkbox>

      {#if generateVariables}
        <div class="field">
          <Label>Collection</Label>
          <Dropdown
            menuItems={collectionOptions}
            bind:value={selectedCollection}
            placeholder="Select collection"
          />
        </div>
      {/if}

      <Checkbox bind:checked={generateFrame}>Generate frame</Checkbox>
    </section>
  </div>

  <footer>
    <Button variant="primary" on:click={handleGenerate} fullWidth>
      Generate
    </Button>
  </footer>
</div>

<style>
  .wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .main {
    flex: 1;
    padding: var(--size-xxsmall);
    overflow-y: auto;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--size-xxsmall);
  }

  .grid-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--size-xxsmall);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--size-xxxsmall);
  }

  .results {
    flex-direction: row;
    gap: var(--size-xsmall);
  }

  .result {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--size-xxxsmall);
  }

  hr {
    border: none;
    border-top: 1px solid var(--figma-color-border);
    margin: var(--size-xsmall) 0;
  }

  footer {
    padding: var(--size-xxsmall);
    border-top: 1px solid var(--figma-color-border);
  }
</style>
