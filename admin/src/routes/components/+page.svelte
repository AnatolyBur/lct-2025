<!-- Главная страница компонентов -->
<script lang="ts">
  import { onMount } from 'svelte';
  import ComponentList from '$lib/components/ComponentList.svelte';
  import ComponentEditor from '$lib/components/ComponentEditor.svelte';
  import Notification from '$lib/components/Notification.svelte';
  import { 
    componentEditMode,
    componentNotification,
    componentActions,
    isCreatingComponent,
    isEditingComponent
  } from '$lib/stores/componentStore';
  import type { ComponentInstance } from '$lib/types/page';

  // Локальное состояние
  let showEditor = false;
  let editingComponent: ComponentInstance | null = null;

  // Обработка редактирования компонента
  function handleEdit(component: ComponentInstance) {
    editingComponent = component;
    showEditor = true;
  }

  // Обработка удаления компонента
  function handleDelete(component: ComponentInstance) {
    // Компонент уже удален в ComponentList, просто обновляем состояние
    if (editingComponent?.id === component.id) {
      editingComponent = null;
      showEditor = false;
    }
  }

  // Обработка создания нового компонента
  function handleCreateNew() {
    componentActions.startCreate();
    showEditor = true;
  }

  // Обработка закрытия редактора
  function handleCloseEditor() {
    showEditor = false;
    editingComponent = null;
    componentActions.startView();
  }

  // Обработка скрытия уведомления
  function handleHideNotification() {
    componentActions.hideNotification();
  }
</script>

<svelte:head>
  <title>Компоненты - Админ панель</title>
</svelte:head>

<div class="components-page">
  {#if showEditor}
    <ComponentEditor 
      onCancel={handleCloseEditor}
    />
  {:else}
    <div class="page-header">
      <h1>Управление компонентами</h1>
      <p>Создавайте и редактируйте компоненты для использования в раскладках страниц</p>
    </div>

    <ComponentList 
      onEdit={handleEdit}
      onDelete={handleDelete}
      allowDragDrop={true}
    />
  {/if}

  <!-- Уведомления -->
  {#if $componentNotification}
    <Notification 
      type={$componentNotification.type}
      message={$componentNotification.message}
      show={$componentNotification.show}
      onClose={handleHideNotification}
    />
  {/if}
</div>

<style>
  .components-page {
    min-height: 100vh;
    background: #f8f9fa;
  }

  .page-header {
    background: white;
    padding: 30px 20px;
    border-bottom: 1px solid #e0e0e0;
    text-align: center;
  }

  .page-header h1 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 2.5em;
  }

  .page-header p {
    margin: 0;
    color: #666;
    font-size: 1.1em;
  }

  @media (max-width: 768px) {
    .page-header {
      padding: 20px 15px;
    }
    
    .page-header h1 {
      font-size: 2em;
    }
    
    .page-header p {
      font-size: 1em;
    }
  }
</style>
