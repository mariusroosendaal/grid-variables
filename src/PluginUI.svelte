<script>
  import { Button, Checkbox, Dropdown, Input, Label, Text } from "figma-ui3-kit-svelte";
  import {
    PluginLayout,
    FieldGroup,
    Footer,
    sendToPlugin,
    createMessageHandler,
  } from "figma-plugin-utils";

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
</script>

<div class="plugin-container">
  <PluginLayout>
    <section class="section">
      <div class="grid-inputs">
        <FieldGroup label="Max width (px)">
          <Input type="number" bind:value={maxWidth} />
        </FieldGroup>
        <FieldGroup label="Columns">
          <Input type="number" bind:value={columns} />
        </FieldGroup>
        <FieldGroup label="Margin (px)">
          <Input type="number" bind:value={margin} />
        </FieldGroup>
        <FieldGroup label="Gutter (px)">
          <Input type="number" bind:value={gutter} />
        </FieldGroup>
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
      <FieldGroup label="Breakpoint/Group">
        <Input bind:value={breakpoint} placeholder="grid/xl" />
      </FieldGroup>

      <Checkbox bind:checked={generateVariables}>
        Generate/update variables
      </Checkbox>

      {#if generateVariables}
        <FieldGroup label="Collection">
          <Dropdown
            menuItems={collectionOptions}
            bind:value={selectedCollection}
            placeholder="Select collection"
          />
        </FieldGroup>
      {/if}

      <Checkbox bind:checked={generateFrame}>Generate frame</Checkbox>
    </section>
  </PluginLayout>

  <Footer variant="full">
    <Button variant="primary" on:click={handleGenerate} fullWidth>
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

  .grid-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--size-xxsmall);
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
</style>
