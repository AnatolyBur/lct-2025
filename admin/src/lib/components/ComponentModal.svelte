<!-- Модальное окно для редактирования компонента -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ComponentEditor from './ComponentEditor.svelte';
  import type { ComponentInstance } from '$lib/types/page';

  export let isOpen = false;
  export let mode: 'create' | 'edit' = 'edit';

  const dispatch = createEventDispatcher();

  function handleClose() {
    dispatch('close');
  }

  function handleSave() {
    dispatch('save');
  }

  function handleCancel() {
    dispatch('cancel');
  }

  // Закрытие по Escape
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  // Предотвращение закрытия при клике на содержимое модалки
  function handleModalClick(event: MouseEvent) {
    event.stopPropagation();
  }

  // Обработка клавиш для доступности
  function handleModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.stopPropagation();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-overlay" on:click={handleClose} on:keydown={handleKeydown} role="dialog" aria-modal="true" tabindex="-1">
    <div class="modal-content" on:click={handleModalClick} on:keydown={handleModalKeydown} role="document">
      <div class="modal-header">
        <h2>
          {#if mode === 'create'}
            Создание компонента
          {:else}
            Редактирование компонента
          {/if}
        </h2>
        <button 
          class="modal-close" 
          on:click={handleClose}
          aria-label="Закрыть модальное окно"
        >
          ✕
        </button>
      </div>
      
      <div class="modal-body">
        <ComponentEditor 
          onCancel={handleCancel}
        />
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    max-width: 90vw;
    max-height: 90vh;
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
    background: #f8f9fa;
  }

  .modal-header h2 {
    margin: 0;
    color: #333;
    font-size: 1.5em;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
    color: #666;
    padding: 5px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .modal-close:hover {
    background: #e0e0e0;
    color: #333;
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 0;
  }

  /* Анимация появления */
  .modal-overlay {
    animation: fadeIn 0.2s ease-out;
  }

  .modal-content {
    animation: slideIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    .modal-overlay {
      padding: 10px;
    }
    
    .modal-content {
      max-width: 95vw;
      max-height: 95vh;
    }
    
    .modal-header {
      padding: 15px;
    }
    
    .modal-header h2 {
      font-size: 1.2em;
    }
  }
</style>
