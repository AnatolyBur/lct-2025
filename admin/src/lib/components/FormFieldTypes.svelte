<!-- Палитра типов полей для конструктора форм -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  // Определение типов полей
  const fieldTypes = [
    {
      type: 'text',
      label: 'Текстовое поле',
      icon: '📝',
      description: 'Однострочный текст'
    },
    {
      type: 'email',
      label: 'Email',
      icon: '📧',
      description: 'Адрес электронной почты'
    },
    {
      type: 'textarea',
      label: 'Многострочный текст',
      icon: '📄',
      description: 'Текст в несколько строк'
    },
    {
      type: 'select',
      label: 'Выпадающий список',
      icon: '📋',
      description: 'Выбор из списка вариантов'
    },
    {
      type: 'radio',
      label: 'Радиокнопки',
      icon: '🔘',
      description: 'Выбор одного варианта'
    },
    {
      type: 'checkbox',
      label: 'Чекбокс',
      icon: '☑️',
      description: 'Да/Нет или множественный выбор'
    },
    {
      type: 'file',
      label: 'Файл',
      icon: '📎',
      description: 'Загрузка файла'
    },
    {
      type: 'date',
      label: 'Дата',
      icon: '📅',
      description: 'Выбор даты'
    },
    {
      type: 'number',
      label: 'Число',
      icon: '🔢',
      description: 'Числовое значение'
    },
    {
      type: 'tel',
      label: 'Телефон',
      icon: '📞',
      description: 'Номер телефона'
    },
    {
      type: 'url',
      label: 'URL',
      icon: '🔗',
      description: 'Веб-адрес'
    }
  ];

  // Обработка добавления поля
  function handleAddField(fieldType: string) {
    dispatch('addField', { fieldType });
  }

  // Обработка перетаскивания
  function handleDragStart(event: DragEvent, fieldType: string) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', fieldType);
      event.dataTransfer.effectAllowed = 'copy';
    }
  }
</script>

<div class="field-types">
  <div class="field-types-header">
    <h4>Добавить поле</h4>
    <p class="field-types-description">
      Выберите тип поля или перетащите его в конструктор
    </p>
  </div>

  <div class="field-types-grid">
    {#each fieldTypes as fieldType}
      <div 
        class="field-type-item"
        draggable="true"
        on:dragstart={(e) => handleDragStart(e, fieldType.type)}
        on:click={() => handleAddField(fieldType.type)}
        role="button"
        tabindex="0"
        on:keydown={(e) => e.key === 'Enter' && handleAddField(fieldType.type)}
      >
        <div class="field-type-icon">
          {fieldType.icon}
        </div>
        <div class="field-type-content">
          <div class="field-type-label">
            {fieldType.label}
          </div>
          <div class="field-type-description">
            {fieldType.description}
          </div>
        </div>
      </div>
    {/each}
  </div>

  <div class="field-types-footer">
    <p class="field-types-hint">
      💡 Подсказка: Перетащите поле в конструктор для точного размещения
    </p>
  </div>
</div>

<style>
  .field-types {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .field-types-header {
    margin-bottom: 1rem;
  }

  .field-types-header h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }

  .field-types-description {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
  }

  .field-types-grid {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem;
    overflow-y: auto;
    max-height: 500px;
  }

  .field-type-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    background: white;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    user-select: none;
  }

  .field-type-item:hover {
    border-color: #3b82f6;
    background: #f8fafc;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  }

  .field-type-item:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .field-type-item:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
  }

  .field-type-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .field-type-content {
    flex: 1;
    min-width: 0;
  }

  .field-type-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.25rem;
  }

  .field-type-description {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.3;
  }

  .field-types-footer {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }

  .field-types-hint {
    margin: 0;
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.4;
    text-align: center;
  }

  /* Стили для перетаскивания */
  .field-type-item[draggable="true"] {
    cursor: grab;
  }

  .field-type-item[draggable="true"]:active {
    cursor: grabbing;
  }


  /* Адаптивность */
  @media (max-width: 768px) {
    .field-types-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .field-type-item {
      flex-direction: column;
      text-align: center;
      gap: 0.5rem;
    }
    
    .field-type-content {
      text-align: center;
    }
  }
</style>
