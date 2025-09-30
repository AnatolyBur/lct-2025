<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { FRONTEND_BASE_URL, buildFrontendUrl } from '$lib/runtimeConfig';

  export let slug: string | undefined;
  export let pageId: number | undefined;
  export let isDraft: boolean | undefined;

  let previewUrl: string = FRONTEND_BASE_URL;

  function buildPreviewUrl(): string {
    const base = slug ? buildFrontendUrl(slug) : FRONTEND_BASE_URL;
    if (isDraft && pageId) {
      const url = new URL(base);
      url.searchParams.set('preview_page_id', String(pageId));
      return url.toString() + '&__garpix_page_draft=true';
    }
    return base + '?__garpix_page_draft=true';
  }

  $: previewUrl = buildPreviewUrl();

  let iframeEl: HTMLIFrameElement | null = null;

  function reloadPreview() {
    if (iframeEl) {
      iframeEl.src = previewUrl;
    }
  }

  let showModal = false;
  let modalIframeEl: HTMLIFrameElement | null = null;

  function openModal() {
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }

  function reloadModalPreview() {
    if (modalIframeEl) {
      modalIframeEl.src = previewUrl;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && showModal) {
      e.stopPropagation();
      closeModal();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="preview-card">
  <div class="preview-header">
    <h3>Предпросмотр страницы</h3>
    <div class="preview-actions">
      <span class="preview-url" title={previewUrl}>{previewUrl}</span>
      <button class="btn btn-secondary" onclick={reloadPreview}>Обновить</button>
      <button class="btn btn-secondary" onclick={openModal}>Развернуть</button>
      <a class="btn btn-primary" href={previewUrl} target="_blank" rel="noopener noreferrer">Открыть в новой вкладке</a>
    </div>
  </div>
  <!-- <div class="preview-frame-wrapper">
    <iframe bind:this={iframeEl} class="preview-frame" src={previewUrl} title="Предпросмотр страницы"></iframe>
  </div> -->
</div>

{#if showModal}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="modal-overlay" onclick={closeModal} onkeydown={(e) => e.key === 'Escape' && closeModal()} role="dialog" aria-modal="true" aria-label="Полноэкранный предпросмотр" tabindex="0">
    <div class="modal-content" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.key === 'Escape' && closeModal()} role="document">
      <div class="modal-header">
        <h3>Полноэкранный предпросмотр</h3>
        <div class="modal-actions">
          <span class="preview-url" title={previewUrl}>{previewUrl}</span>
          <button class="btn btn-secondary" onclick={reloadModalPreview}>Обновить</button>
          <a class="btn btn-primary" href={previewUrl} target="_blank" rel="noopener noreferrer">Открыть в новой вкладке</a>
          <button class="modal-close" onclick={closeModal}>✕</button>
        </div>
      </div>
      <div class="modal-body">
        <iframe bind:this={modalIframeEl} class="modal-frame" src={previewUrl} title="Полноэкранный предпросмотр"></iframe>
      </div>
    </div>
  </div>
{/if}

<style>
  .preview-card {
    margin-top: var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2);
    background: var(--color-surface);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }

  .preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .preview-header h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .preview-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .preview-url {
    max-width: 380px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  /* Локальные стили кнопок удалены — используются глобальные .btn */

  /* .preview-frame-wrapper { width: 100%; height: 70vh; background: #111827; } */

  /* .preview-frame { width: 100%; height: 100%; border: 0; background: #ffffff; } */

  /* Модальное окно */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: var(--color-surface);
    width: 100%;
    max-width: 1200px;
    height: 85vh;
    border-radius: var(--radius-2);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--color-border);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg);
  }

  .modal-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--color-muted);
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-1);
  }

  .modal-close:hover {
    background: #e5e7eb;
  }

  .modal-body {
    flex: 1;
    background: #111827;
  }

  .modal-frame {
    width: 100%;
    height: 100%;
    border: 0;
    background: #ffffff;
  }
</style>
