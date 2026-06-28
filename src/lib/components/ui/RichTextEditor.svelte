<script lang="ts">
  import { onMount } from 'svelte';

  let { html = $bindable() } = $props<{ html: string }>();

  let editorRef: HTMLDivElement;

  function exec(command: string, value: string | undefined = undefined) {
    document.execCommand(command, false, value);
    updateHtml();
  }

  function updateHtml() {
    if (editorRef) {
      html = editorRef.innerHTML;
    }
  }

  onMount(() => {
    if (editorRef && html) {
      editorRef.innerHTML = html;
    }
    
    // Add event listener to update internal HTML on input
    editorRef.addEventListener('input', updateHtml);
    return () => {
      editorRef.removeEventListener('input', updateHtml);
    };
  });

  // Watch for external html changes
  $effect(() => {
    if (editorRef && html !== editorRef.innerHTML) {
      editorRef.innerHTML = html;
    }
  });

</script>

<div class="rich-text-editor">
  <div class="toolbar">
    <button type="button" onclick={() => exec('bold')} title="Bold"><i class="ti ti-bold"></i></button>
    <button type="button" onclick={() => exec('italic')} title="Italic"><i class="ti ti-italic"></i></button>
    <button type="button" onclick={() => exec('underline')} title="Underline"><i class="ti ti-underline"></i></button>
    <div class="divider"></div>
    <button type="button" onclick={() => exec('insertUnorderedList')} title="Bullet List"><i class="ti ti-list"></i></button>
    <button type="button" onclick={() => exec('insertOrderedList')} title="Numbered List"><i class="ti ti-list-numbers"></i></button>
    <div class="divider"></div>
    <button type="button" onclick={() => {
      const url = prompt('Enter link URL:');
      if (url) exec('createLink', url);
    }} title="Link"><i class="ti ti-link"></i></button>
    <button type="button" onclick={() => {
      const url = prompt('Enter image URL:');
      if (url) exec('insertImage', url);
    }} title="Image"><i class="ti ti-photo"></i></button>
  </div>
  <div
    class="editor-content"
    contenteditable="true"
    bind:this={editorRef}
  ></div>
</div>

<style>
  .rich-text-editor {
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: #fff;
    display: flex;
    flex-direction: column;
  }
  .toolbar {
    display: flex;
    gap: 4px;
    padding: 8px;
    background: #f8fafc;
    border-bottom: 1px solid var(--border);
    align-items: center;
    flex-wrap: wrap;
  }
  .toolbar button {
    background: none;
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 6px;
    cursor: pointer;
    color: var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .toolbar button:hover {
    background: #e2e8f0;
  }
  .divider {
    width: 1px;
    height: 20px;
    background: var(--border);
    margin: 0 4px;
  }
  .editor-content {
    padding: 12px;
    min-height: 150px;
    max-height: 400px;
    overflow-y: auto;
    outline: none;
  }
  .editor-content :global(ul) { list-style-type: disc; padding-left: 20px; }
  .editor-content :global(ol) { list-style-type: decimal; padding-left: 20px; }
  .editor-content :global(img) { max-width: 100%; height: auto; }
</style>
