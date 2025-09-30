<!-- Компонент уведомлений -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
  export let message: string = '';
  export let duration: number = 5000; // Автоматическое скрытие через 5 секунд
  export let show: boolean = true;

  const dispatch = createEventDispatcher();

  // Автоматическое скрытие уведомления
  let timeoutId: number;
  
  $: if (show && duration > 0) {
    timeoutId = setTimeout(() => {
      hide();
    }, duration);
  }

  function hide() {
    show = false;
    dispatch('hide');
  }

  function handleClick() {
    hide();
  }

  // Получение иконки для типа уведомления
  function getIcon(): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  }
</script>

{#if show}
  <div 
    class="notification notification-{type}"
    role="alert"
    on:click={handleClick}
    on:keydown={(e) => e.key === 'Escape' && hide()}
    tabindex="0"
  >
    <div class="notification-content">
      <span class="notification-icon">{getIcon()}</span>
      <span class="notification-message">{message}</span>
      <button class="notification-close" on:click={handleClick}>
        ✕
      </button>
    </div>
  </div>
{/if}

<style>
  .notification {
    position: fixed;
    top: 1rem;
    right: 1rem;
    max-width: 400px;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  }

  .notification-content {
    display: flex;
    align-items: center;
    padding: 1rem;
    gap: 0.75rem;
  }

  .notification-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .notification-message {
    flex: 1;
    font-weight: 500;
  }

  .notification-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.15s ease-in-out;
    flex-shrink: 0;
  }

  .notification-close:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  /* Типы уведомлений */
  .notification-success {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }

  .notification-error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
  }

  .notification-warning {
    background-color: #fffbeb;
    border: 1px solid #fed7aa;
    color: #d97706;
  }

  .notification-info {
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #2563eb;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>
