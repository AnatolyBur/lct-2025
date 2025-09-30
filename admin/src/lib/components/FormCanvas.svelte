<!-- Рабочая область конструктора форм с drag & drop -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { FormBuilderConfig, FormBuilderField } from '$lib/types/formBuilder';

  const dispatch = createEventDispatcher();

  export let form: FormBuilderConfig;
  export let selectedField: FormBuilderField | null = null;

  // Локальное состояние для drag & drop
  let dragOverIndex: number | null = null;
  let isDragging = false;
  let draggedField: FormBuilderField | null = null;

  // Обработка начала перетаскивания
  function handleDragStart(event: DragEvent, field: FormBuilderField) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', field.id);
      event.dataTransfer.effectAllowed = 'move';
      draggedField = field;
      isDragging = true;
    }
  }

  // Обработка перетаскивания над областью
  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    dragOverIndex = index;
  }

  // Обработка выхода из области перетаскивания
  function handleDragLeave() {
    dragOverIndex = null;
  }

  // Обработка сброса элемента
  function handleDrop(event: DragEvent, index: number) {
    event.preventDefault();
    
    if (event.dataTransfer) {
      const fieldId = event.dataTransfer.getData('text/plain');
      const field = form?.form_config?.fields?.find(f => f.id === fieldId);
      
      if (field) {
        // Перемещаем поле на новую позицию
        const newFields = [...(form?.form_config?.fields || [])];
        const oldIndex = newFields.findIndex(f => f.id === fieldId);
        
        if (oldIndex !== -1) {
          newFields.splice(oldIndex, 1);
          newFields.splice(index, 0, field);
          
          dispatch('reorderFields', { 
            fieldIds: newFields.map(f => f.id) 
          });
        }
      }
    }
    
    dragOverIndex = null;
    isDragging = false;
    draggedField = null;
  }

  // Обработка добавления нового поля
  function handleCanvasDrop(event: DragEvent) {
    event.preventDefault();
    
    if (event.dataTransfer) {
      const fieldType = event.dataTransfer.getData('text/plain');
      
      if (fieldType && !form?.form_config?.fields?.find(f => f.id === fieldType)) {
        // Это новый тип поля, добавляем его
        dispatch('addField', { fieldType });
      }
    }
  }

  // Обработка клика по полю
  function handleFieldClick(field: FormBuilderField) {
    dispatch('selectField', { field });
  }

  // Обработка удаления поля
  function handleDeleteField(fieldId: string) {
    if (confirm('Вы уверены, что хотите удалить это поле?')) {
      dispatch('deleteField', { fieldId });
    }
  }

  // Обработка двойного клика по полю
  function handleFieldDoubleClick(field: FormBuilderField) {
    dispatch('selectField', { field });
    // Здесь можно открыть модальное окно редактирования
  }

  // Получение CSS классов для поля
  function getFieldClasses(field: FormBuilderField, index: number): string {
    const classes = ['form-field-item'];
    
    if (selectedField?.id === field.id) {
      classes.push('selected');
    }
    
    if (dragOverIndex === index) {
      classes.push('drag-over');
    }
    
    if (isDragging && draggedField?.id === field.id) {
      classes.push('dragging');
    }
    
    return classes.join(' ');
  }

  // Получение иконки для типа поля
  function getFieldIcon(type: string): string {
    const icons: Record<string, string> = {
      text: '📝',
      email: '📧',
      textarea: '📄',
      select: '📋',
      radio: '🔘',
      checkbox: '☑️',
      file: '📎',
      date: '📅',
      number: '🔢',
      tel: '📞',
      url: '🔗'
    };
    return icons[type] || '📝';
  }
</script>

<div class="form-canvas">
  <div class="canvas-header">
    <h3>Конструктор формы</h3>
    <div class="canvas-info">
      <span class="field-count">
        {form?.form_config?.fields?.length || 0} полей
      </span>
    </div>
  </div>

  <div 
    class="canvas-content"
    role="region"
    aria-label="Область конструктора формы"
    on:dragover={(e) => e.preventDefault()}
    on:drop={handleCanvasDrop}
  >
    {#if !form?.form_config?.fields || form.form_config.fields.length === 0}
      <div class="empty-canvas">
        <div class="empty-icon">📝</div>
        <h4>Форма пуста</h4>
        <p>Перетащите поля из панели слева или выберите тип поля для добавления</p>
      </div>
    {:else}
      <div class="fields-container">
        {#each form?.form_config?.fields || [] as field, index (field.id)}
          <div 
            class={getFieldClasses(field, index)}
            draggable="true"
            on:dragstart={(e) => handleDragStart(e, field)}
            on:dragover={(e) => handleDragOver(e, index)}
            on:dragleave={handleDragLeave}
            on:drop={(e) => handleDrop(e, index)}
            on:click={() => handleFieldClick(field)}
            on:dblclick={() => handleFieldDoubleClick(field)}
            role="button"
            tabindex="0"
            on:keydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFieldClick(field);
              } else if (e.key === 'Delete') {
                e.preventDefault();
                handleDeleteField(field.id);
              }
            }}
          >
            <div class="field-header">
              <div class="field-icon">
                {getFieldIcon(field.type)}
              </div>
              <div class="field-info">
                <div class="field-label">
                  {field.label}
                  {#if field.required}
                    <span class="required">*</span>
                  {/if}
                </div>
                <div class="field-type">
                  {field.type}
                </div>
              </div>
              <div class="field-actions">
                <button 
                  class="btn-delete"
                  on:click|stopPropagation={() => handleDeleteField(field.id)}
                  title="Удалить поле"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div class="field-preview">
              {#if field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'url'}
                <input 
                  type={field.type} 
                  placeholder={field.placeholder || field.label}
                  disabled
                  class="preview-input"
                />
              {:else if field.type === 'number'}
                <input 
                  type="number" 
                  placeholder={field.placeholder || field.label}
                  disabled
                  class="preview-input"
                />
              {:else if field.type === 'textarea'}
                <textarea 
                  placeholder={field.placeholder || field.label}
                  disabled
                  class="preview-textarea"
                  rows="3"
                ></textarea>
              {:else if field.type === 'select'}
                <select disabled class="preview-select">
                  <option>{field.placeholder || '-- Выберите --'}</option>
                </select>
              {:else if field.type === 'radio'}
                <div class="preview-radio-group">
                  {#each field.options?.slice(0, 2) || [] as option}
                    <label class="preview-radio-label">
                      <input type="radio" disabled />
                      <span>{option.label}</span>
                    </label>
                  {/each}
                  {#if (field.options?.length || 0) > 2}
                    <span class="more-options">...</span>
                  {/if}
                </div>
              {:else if field.type === 'checkbox'}
                <label class="preview-checkbox-label">
                  <input type="checkbox" disabled />
                  <span>{field.label}</span>
                </label>
              {:else if field.type === 'file'}
                <input type="file" disabled class="preview-file" />
              {:else if field.type === 'date'}
                <input type="date" disabled class="preview-input" />
              {/if}
            </div>
            
            {#if field.help_text}
              <div class="field-help">
                {field.help_text}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="canvas-footer">
    <div class="canvas-hints">
      <p>💡 Подсказки:</p>
      <ul>
        <li>Кликните на поле для выбора</li>
        <li>Перетащите поле для изменения порядка</li>
        <li>Двойной клик для быстрого редактирования</li>
        <li>Нажмите Delete для удаления выбранного поля</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .form-canvas {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f8fafc;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .canvas-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: white;
    border-bottom: 1px solid #e2e8f0;
  }

  .canvas-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }

  .canvas-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .field-count {
    font-size: 0.875rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
  }

  .canvas-content {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
    min-height: 400px;
  }

  .empty-canvas {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-canvas h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
  }

  .empty-canvas p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    max-width: 300px;
  }

  .fields-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-field-item {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    position: relative;
  }

  .form-field-item:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  }

  .form-field-item.selected {
    border-color: #3b82f6;
    background: #f0f9ff;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-field-item.drag-over {
    border-color: #10b981;
    background: #f0fdf4;
  }

  .form-field-item.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
  }

  .field-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .field-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .field-info {
    flex: 1;
    min-width: 0;
  }

  .field-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
  }

  .required {
    color: #ef4444;
    margin-left: 0.25rem;
  }

  .field-type {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .field-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-delete {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    transition: all 0.15s ease-in-out;
  }

  .btn-delete:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  .field-preview {
    margin-bottom: 0.5rem;
  }

  .preview-input,
  .preview-textarea,
  .preview-select,
  .preview-file {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    background: #f9fafb;
    color: #6b7280;
  }

  .preview-textarea {
    resize: none;
  }

  .preview-radio-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .preview-radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .preview-radio-label input {
    margin: 0;
  }

  .more-options {
    font-size: 0.75rem;
    color: #9ca3af;
    font-style: italic;
  }

  .preview-checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .preview-checkbox-label input {
    margin: 0;
  }

  .field-help {
    font-size: 0.75rem;
    color: #6b7280;
    font-style: italic;
  }

  .canvas-footer {
    padding: 1rem;
    background: white;
    border-top: 1px solid #e2e8f0;
  }

  .canvas-hints {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .canvas-hints p {
    margin: 0 0 0.5rem 0;
    font-weight: 500;
  }

  .canvas-hints ul {
    margin: 0;
    padding-left: 1rem;
  }

  .canvas-hints li {
    margin-bottom: 0.25rem;
  }

  /* Адаптивность */
  @media (max-width: 768px) {
    .canvas-header {
      flex-direction: column;
      gap: 0.5rem;
      align-items: stretch;
    }

    .canvas-info {
      justify-content: center;
    }

    .field-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .field-actions {
      align-self: flex-end;
    }
  }
</style>
