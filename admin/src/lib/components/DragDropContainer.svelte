<!-- Контейнер с поддержкой drag and drop -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import DraggableComponent from './DraggableComponent.svelte';
  import type { ComponentInstance } from '$lib/types/page';

  export let components: ComponentInstance[] = [];
  export let allowDrop = true;
  export let showDropZone = true;
  export let onEdit: (component: ComponentInstance) => void = () => {};
  export let onDelete: (component: ComponentInstance) => void = () => {};

  const dispatch = createEventDispatcher();

  let draggedComponent: ComponentInstance | null = null;
  let dropTargetComponent: ComponentInstance | null = null;
  let isDragOver = false;

  function handleDragStart(event: CustomEvent) {
    draggedComponent = event.detail.component;
    dispatch('dragstart', event.detail);
  }

  function handleDragEnd(event: CustomEvent) {
    draggedComponent = null;
    dropTargetComponent = null;
    isDragOver = false;
    dispatch('dragend', event.detail);
  }

  function handleDragOver(event: CustomEvent) {
    if (!allowDrop) return;
    
    const { component } = event.detail;
    if (draggedComponent && component.id !== draggedComponent.id) {
      dropTargetComponent = component;
      isDragOver = true;
    }
  }

  function handleDrop(event: CustomEvent) {
    if (!allowDrop) return;
    
    const { draggedComponentId, targetComponent } = event.detail;
    
    console.log('🎯 DragDropContainer: Обработка drop', {
      draggedComponentId,
      targetComponentId: targetComponent.id,
      targetComponentTitle: targetComponent.component.name
    }, components);
    
    // Находим индексы компонентов (приводим к строке на всякий случай)
    const draggedIndex = components.findIndex(c => String(c.id) === String(draggedComponentId));
    const targetIndex = components.findIndex(c => String(c.id) === String(targetComponent.id));
    
    console.log('📍 DragDropContainer: Индексы', {
      draggedIndex,
      targetIndex,
      componentsCount: components.length
    });
    
    if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
      // Создаем новый массив с переставленными элементами
      const newComponents = [...components];
      const [draggedItem] = newComponents.splice(draggedIndex, 1);
      newComponents.splice(targetIndex, 0, draggedItem);
      
      console.log('🔄 DragDropContainer: Новый порядок', {
        oldOrder: components.map(c => c.component.name),
        newOrder: newComponents.map(c => c.component.name)
      });
      
      dispatch('reorder', {
        components: newComponents,
        draggedComponentId,
        targetComponentId: targetComponent.id,
        draggedIndex,
        targetIndex
      });
    } else {
      console.log('⚠️ DragDropContainer: Drop не выполнен', {
        draggedIndex,
        targetIndex,
        samePosition: draggedIndex === targetIndex
      });
    }
    
    // Сбрасываем состояние
    draggedComponent = null;
    dropTargetComponent = null;
    isDragOver = false;
  }

  function handleDragEnter(event: CustomEvent) {
    if (!allowDrop) return;
    const { component } = event.detail;
    if (draggedComponent && component.id !== draggedComponent.id) {
      dropTargetComponent = component;
    }
  }

  function handleDragLeave(event: CustomEvent) {
    // Не сбрасываем dropTargetComponent здесь, так как это может вызвать мерцание
  }

  function handleDropZoneDragOver(event: DragEvent) {
    if (!allowDrop || !showDropZone) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    isDragOver = true;
  }

  function handleDropZoneDrop(event: DragEvent) {
    if (!allowDrop || !showDropZone) return;
    event.preventDefault();
    
    const draggedComponentId = event.dataTransfer?.getData('text/plain');
    if (draggedComponentId) {
      dispatch('drop', {
        draggedComponentId,
        targetIndex: components.length,
        event
      });
    }
    
    isDragOver = false;
  }

  function handleDropZoneDragLeave(event: DragEvent) {
    // Проверяем, что мы действительно покинули зону drop
    const target = event.currentTarget as HTMLElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      if (
        event.clientX < rect.left || 
        event.clientX > rect.right || 
        event.clientY < rect.top || 
        event.clientY > rect.bottom
      ) {
        isDragOver = false;
      }
    }
  }
</script>

<div class="drag-drop-container">
  {#each components as component, index (component.id)}
    <DraggableComponent 
      {component}
      isDragging={draggedComponent?.id === component.id}
      isDropTarget={dropTargetComponent?.id === component.id}
      {onEdit}
      {onDelete}
      on:dragstart={handleDragStart}
      on:dragend={handleDragEnd}
      on:dragover={handleDragOver}
      on:drop={handleDrop}
      on:dragenter={handleDragEnter}
      on:dragleave={handleDragLeave}
    />
  {/each}

  {#if showDropZone && allowDrop}
    <div 
      class="drop-zone"
      class:active={isDragOver && !dropTargetComponent}
      on:dragover={handleDropZoneDragOver}
      on:drop={handleDropZoneDrop}
      on:dragleave={handleDropZoneDragLeave}
      role="region"
      aria-label="Зона для перетаскивания компонентов"
    >
      <div class="drop-zone-content">
        <div class="drop-zone-icon">📥</div>
        <p class="drop-zone-text">
          {#if isDragOver && !dropTargetComponent}
            Отпустите компонент здесь
          {:else}
            Перетащите компонент сюда для добавления в конец списка
          {/if}
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  .drag-drop-container {
    min-height: 100px;
  }

  .drop-zone {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 20px;
    margin-top: 10px;
    text-align: center;
    background: #fafafa;
    transition: all 0.2s ease;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .drop-zone.active {
    border-color: #007bff;
    background: #f0f8ff;
    border-style: solid;
  }

  .drop-zone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .drop-zone-icon {
    font-size: 2em;
    opacity: 0.6;
  }

  .drop-zone.active .drop-zone-icon {
    opacity: 1;
    animation: bounce 0.5s ease-in-out;
  }

  .drop-zone-text {
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  .drop-zone.active .drop-zone-text {
    color: #007bff;
    font-weight: 500;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }

  @media (max-width: 768px) {
    .drop-zone {
      padding: 15px;
      min-height: 50px;
    }
    
    .drop-zone-icon {
      font-size: 1.5em;
    }
    
    .drop-zone-text {
      font-size: 12px;
    }
  }
</style>
