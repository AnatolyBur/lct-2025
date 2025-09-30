<!-- Перетаскиваемый компонент -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import type { ComponentInstance } from '$lib/types/page';

  export let component: ComponentInstance;
  export let isDragging = false;
  export let isDropTarget = false;
  export let onEdit: (component: ComponentInstance) => void = () => {};
  export let onDelete: (component: ComponentInstance) => void = () => {};

  const dispatch = createEventDispatcher();

  let dragElement: HTMLElement;
  let dragStartX = 0;
  let dragStartY = 0;

  function handleDragStart(event: DragEvent) {
    if (!event.dataTransfer) return;
    
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(component.id));
    
    // Добавляем визуальную обратную связь
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '0.5';
    }
    
    dispatch('dragstart', { component });
  }

  function handleDragEnd(event: DragEvent) {
    // Восстанавливаем визуальное состояние
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '1';
    }
    
    dispatch('dragend', { component });
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    
    dispatch('dragover', { component, event });
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    
    const draggedComponentId = event.dataTransfer?.getData('text/plain');
    if (draggedComponentId && draggedComponentId !== String(component.id)) {
      dispatch('drop', { 
        draggedComponentId, 
        targetComponent: component,
        event 
      });
    }
  }

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    dispatch('dragenter', { component });
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    dispatch('dragleave', { component });
  }

  function handleEditClick(event: MouseEvent) {
    event.stopPropagation();
    onEdit(component);
  }

  function handleDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    onDelete(component);
  }

  // Получение иконки для типа компонента
  function getTypeIcon(type: string): string {
    switch (type) {
      case 'content': return '📝';
      case 'media': return '🖼️';
      case 'form': return '📋';
      case 'layout': return '📐';
      default: return '⚙️';
    }
  }

  // Форматирование даты
  function formatDate(dateString?: string): string {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  }

  // Получение ID формы из данных компонента
  function getFormId(component: ComponentInstance): number | null {
    return component.id;
  }

  // Проверка, является ли компонент формой
  function isFormComponent(component: ComponentInstance): boolean {
    return component.component.type === 'form' || 
           component.component.type === 'FormComponent' ||
           component.component.component_type === 'form' ||
           component.component.component_type === 'FormComponent';
  }

  // Навигация к редактированию формы
  function navigateToFormEdit(event: MouseEvent) {
    event.stopPropagation();
    const formId = getFormId(component);
    if (formId) {
      goto(`/forms/${formId}`);
    }
  }

  // Получение человеко-читаемого названия поля из предобработанных данных
  function getFieldDisplayName(component: ComponentInstance, fieldKey: string): string {
    // Используем предобработанные данные из store
    return component.fieldDisplayNames?.[fieldKey] || 
           fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1).replace(/_/g, ' ');
  }
</script>

<div 
  class="draggable-component"
  class:dragging={isDragging}
  class:drop-target={isDropTarget}
  draggable="true"
  on:dragstart={handleDragStart}
  on:dragend={handleDragEnd}
  on:dragover={handleDragOver}
  on:drop={handleDrop}
  on:dragenter={handleDragEnter}
  on:dragleave={handleDragLeave}
  role="button"
  tabindex="0"
  aria-label="Компонент {component.component.name || component.component.title || component.data?.object?.title || component.data?.title || component.component.type || 'неизвестный'}, перетащите для изменения порядка"
>
  <div class="drag-handle" title="Перетащите для изменения порядка">
    ⋮⋮
  </div>
  
  <div class="component-content">
    <div class="component-header">
      <div class="component-icon">
        {getTypeIcon(component.component.type)}
      </div>
      <div class="component-info">
        <h3 class="component-name">
          {component.component.name || component.component.title || component.data?.object?.title || component.data?.title || `Компонент ${component.component.type || component.component.component_type || 'неизвестный'}`}
        </h3>
        <span class="component-type">{component.component.type}</span>
      </div>
    </div>

    <div class="component-data">
      {#each Object.entries(component.data.object) as [key, value]}
        <div class="data-item">
          <strong>{getFieldDisplayName(component, key)}:</strong> 
          <span class="data-value">{String(value).substring(0, 30)}{String(value).length > 30 ? '...' : ''}</span>
        </div>
      {/each}
    </div>

    <div class="component-footer">
      <div class="component-meta">
        <small>Создан: {formatDate(component.created_at)}</small>
      </div>
      <div class="component-actions">
        {#if isFormComponent(component)}
          <button 
            class="btn btn-sm btn-primary"
            on:click={navigateToFormEdit}
            title="Редактировать форму"
            disabled={!getFormId(component)}
          >
            📋
          </button>
        {/if}
        <button 
          class="btn btn-sm btn-secondary"
          on:click={handleEditClick}
          title="Редактировать компонент"
        >
          ✏️
        </button>
        <button 
          class="btn btn-sm btn-danger"
          on:click={handleDeleteClick}
          title="Удалить"
        >
          🗑️
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .draggable-component {
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 10px;
    cursor: move;
    transition: all 0.2s ease;
    position: relative;
    user-select: none;
  }

  .draggable-component:hover {
    border-color: #007bff;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
  }

  .draggable-component.dragging {
    opacity: 0.5;
    transform: rotate(5deg);
    z-index: 1000;
  }

  .draggable-component.drop-target {
    border-color: #28a745;
    background: #f8fff8;
    box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
  }

  .drag-handle {
    position: absolute;
    top: 5px;
    right: 5px;
    color: #999;
    font-size: 12px;
    cursor: grab;
    padding: 2px;
    border-radius: 2px;
    transition: color 0.2s ease;
  }

  .drag-handle:hover {
    color: #666;
  }

  .draggable-component:active .drag-handle {
    cursor: grabbing;
  }

  .component-content {
    padding-right: 20px; /* Место для drag handle */
  }

  .component-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }

  .component-icon {
    font-size: 1.2em;
    margin-right: 8px;
  }

  .component-info {
    flex: 1;
  }

  .component-name {
    margin: 0 0 4px 0;
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }

  .component-type {
    background: #007bff;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 500;
  }

  .component-data {
    margin-bottom: 8px;
  }

  .data-item {
    margin-bottom: 4px;
    font-size: 11px;
    line-height: 1.3;
  }

  .data-item strong {
    color: #495057;
    margin-right: 4px;
  }

  .data-value {
    color: #666;
  }

  .component-footer {
    border-top: 1px solid #f0f0f0;
    padding-top: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .component-meta small {
    color: #999;
    font-size: 10px;
  }

  .component-actions {
    display: flex;
    gap: 4px;
  }

  .btn {
    padding: 4px 6px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 10px;
    transition: all 0.2s ease;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #545b62;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #c82333;
  }

  .btn-sm {
    padding: 3px 5px;
    font-size: 9px;
  }

  /* Анимация при перетаскивании */
  .draggable-component {
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }

  /* Улучшенная доступность */
  .draggable-component:focus {
    outline: 2px solid #007bff;
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    .draggable-component {
      padding: 12px;
    }
    
    .component-name {
      font-size: 13px;
    }
    
    .data-item {
      font-size: 10px;
    }
  }
</style>
