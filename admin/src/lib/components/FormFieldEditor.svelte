<!-- Редактор свойств поля формы -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { FormBuilderField, ValidationRule, SelectOption } from '$lib/types/formBuilder';

  const dispatch = createEventDispatcher();

  export let field: FormBuilderField;

  // Локальное состояние для редактирования
  let localField: FormBuilderField = { ...field };
  let activeTab: 'basic' | 'validation' | 'advanced' = 'basic';

  // Реактивное обновление при изменении поля
  $: localField = { ...field };

  // Обработка изменения значения
  function handleChange(property: string, value: any) {
    localField = { ...localField, [property]: value };
    dispatch('update', { updates: { [property]: value } });
  }

  // Обработка изменения вложенного свойства
  function handleNestedChange(path: string, value: any) {
    const keys = path.split('.');
    const updated = { ...localField };
    let current = updated;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    localField = updated;
    dispatch('update', { updates: { [path]: value } });
  }

  // Добавление опции для select/radio
  function addOption() {
    const newOption: SelectOption = {
      value: `option_${Date.now()}`,
      label: 'Новая опция',
      selected: false
    };
    
    const options = [...(localField.options || []), newOption];
    handleChange('options', options);
  }

  // Удаление опции
  function removeOption(index: number) {
    const options = [...(localField.options || [])];
    options.splice(index, 1);
    handleChange('options', options);
  }

  // Обновление опции
  function updateOption(index: number, property: keyof SelectOption, value: any) {
    const options = [...(localField.options || [])];
    options[index] = { ...options[index], [property]: value };
    handleChange('options', options);
  }

  // Добавление правила валидации
  function addValidationRule() {
    const newRule: ValidationRule = {
      type: 'required',
      message: 'Поле обязательно для заполнения',
      value: null
    };
    
    const rules = [...(localField.validation || []), newRule];
    handleChange('validation', rules);
  }

  // Удаление правила валидации
  function removeValidationRule(index: number) {
    const rules = [...(localField.validation || [])];
    rules.splice(index, 1);
    handleChange('validation', rules);
  }

  // Обновление правила валидации
  function updateValidationRule(index: number, property: keyof ValidationRule, value: any) {
    const rules = [...(localField.validation || [])];
    rules[index] = { ...rules[index], [property]: value };
    handleChange('validation', rules);
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

  // Получение названия типа поля
  function getFieldTypeName(type: string): string {
    const names: Record<string, string> = {
      text: 'Текстовое поле',
      email: 'Email',
      textarea: 'Многострочный текст',
      select: 'Выпадающий список',
      radio: 'Радиокнопки',
      checkbox: 'Чекбокс',
      file: 'Файл',
      date: 'Дата',
      number: 'Число',
      tel: 'Телефон',
      url: 'URL'
    };
    return names[type] || type;
  }
</script>

<div class="field-editor">
  <div class="editor-header">
    <div class="field-info">
      <div class="field-icon">{getFieldIcon(localField.type)}</div>
      <div class="field-details">
        <h3>{localField.label || 'Без названия'}</h3>
        <p>{getFieldTypeName(localField.type)}</p>
      </div>
    </div>
  </div>

  <div class="editor-tabs">
    <button 
      class="tab-button {activeTab === 'basic' ? 'active' : ''}"
      on:click={() => activeTab = 'basic'}
    >
      Основное
    </button>
    <button 
      class="tab-button {activeTab === 'validation' ? 'active' : ''}"
      on:click={() => activeTab = 'validation'}
    >
      Валидация
    </button>
    <button 
      class="tab-button {activeTab === 'advanced' ? 'active' : ''}"
      on:click={() => activeTab = 'advanced'}
    >
      Дополнительно
    </button>
  </div>

  <div class="editor-content">
    {#if activeTab === 'basic'}
      <div class="tab-panel">
        <div class="form-group">
          <label for="field-label">Название поля</label>
          <input
            id="field-label"
            type="text"
            value={localField.label}
            on:input={(e) => handleChange('label', e.target.value)}
            placeholder="Введите название поля"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="field-name">Имя поля</label>
          <input
            id="field-name"
            type="text"
            value={localField.name}
            on:input={(e) => handleChange('name', e.target.value)}
            placeholder="field_name"
            class="form-input"
          />
          <small class="form-help">Используется для идентификации поля в коде</small>
        </div>

        <div class="form-group">
          <label for="field-placeholder">Подсказка</label>
          <input
            id="field-placeholder"
            type="text"
            value={localField.placeholder || ''}
            on:input={(e) => handleChange('placeholder', e.target.value)}
            placeholder="Введите подсказку"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="field-help">Справка</label>
          <textarea
            id="field-help"
            value={localField.help_text || ''}
            on:input={(e) => handleChange('help_text', e.target.value)}
            placeholder="Дополнительная информация о поле"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input
              type="checkbox"
              checked={localField.required}
              on:change={(e) => handleChange('required', e.target.checked)}
            />
            <span>Обязательное поле</span>
          </label>
        </div>

        <div class="form-group">
          <label for="field-default">Значение по умолчанию</label>
          <input
            id="field-default"
            type="text"
            value={localField.default_value || ''}
            on:input={(e) => handleChange('default_value', e.target.value)}
            placeholder="Значение по умолчанию"
            class="form-input"
          />
        </div>

        <!-- Опции для select и radio -->
        {#if localField.type === 'select' || localField.type === 'radio'}
          <div class="form-group">
            <label>Опции</label>
            <div class="options-list">
              {#each localField.options || [] as option, index}
                <div class="option-item">
                  <input
                    type="text"
                    value={option.value}
                    on:input={(e) => updateOption(index, 'value', e.target.value)}
                    placeholder="Значение"
                    class="form-input option-value"
                  />
                  <input
                    type="text"
                    value={option.label}
                    on:input={(e) => updateOption(index, 'label', e.target.value)}
                    placeholder="Название"
                    class="form-input option-label"
                  />
                  <button
                    type="button"
                    class="btn-remove"
                    on:click={() => removeOption(index)}
                    title="Удалить опцию"
                  >
                    ✕
                  </button>
                </div>
              {/each}
              <button type="button" class="btn-add" on:click={addOption}>
                + Добавить опцию
              </button>
            </div>
          </div>
        {/if}

        <!-- Дополнительные настройки для файлов -->
        {#if localField.type === 'file'}
          <div class="form-group">
            <label for="field-accept">Разрешенные типы файлов</label>
            <input
              id="field-accept"
              type="text"
              value={localField.accept || ''}
              on:input={(e) => handleChange('accept', e.target.value)}
              placeholder="image/*, .pdf, .doc"
              class="form-input"
            />
            <small class="form-help">Например: image/*, .pdf, .doc</small>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                checked={localField.multiple || false}
                on:change={(e) => handleChange('multiple', e.target.checked)}
              />
              <span>Разрешить множественный выбор</span>
            </label>
          </div>
        {/if}

        <!-- Дополнительные настройки для числовых полей -->
        {#if localField.type === 'number'}
          <div class="form-group">
            <label for="field-min">Минимальное значение</label>
            <input
              id="field-min"
              type="number"
              value={localField.min || ''}
              on:input={(e) => handleChange('min', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Минимум"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="field-max">Максимальное значение</label>
            <input
              id="field-max"
              type="number"
              value={localField.max || ''}
              on:input={(e) => handleChange('max', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Максимум"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="field-step">Шаг</label>
            <input
              id="field-step"
              type="number"
              value={localField.step || ''}
              on:input={(e) => handleChange('step', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Шаг"
              class="form-input"
            />
          </div>
        {/if}

        <!-- Дополнительные настройки для текстовых полей -->
        {#if localField.type === 'text' || localField.type === 'textarea' || localField.type === 'email'}
          <div class="form-group">
            <label for="field-maxlength">Максимальная длина</label>
            <input
              id="field-maxlength"
              type="number"
              value={localField.max_length || ''}
              on:input={(e) => handleChange('max_length', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Максимальная длина"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="field-minlength">Минимальная длина</label>
            <input
              id="field-minlength"
              type="number"
              value={localField.min_length || ''}
              on:input={(e) => handleChange('min_length', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Минимальная длина"
              class="form-input"
            />
          </div>
        {/if}
      </div>
    {:else if activeTab === 'validation'}
      <div class="tab-panel">
        <div class="validation-rules">
          {#each localField.validation || [] as rule, index}
            <div class="validation-rule">
              <div class="rule-header">
                <select
                  value={rule.type}
                  on:change={(e) => updateValidationRule(index, 'type', e.target.value)}
                  class="form-select"
                >
                  <option value="required">Обязательное</option>
                  <option value="email">Email</option>
                  <option value="min_length">Минимальная длина</option>
                  <option value="max_length">Максимальная длина</option>
                  <option value="pattern">Регулярное выражение</option>
                  <option value="min">Минимальное значение</option>
                  <option value="max">Максимальное значение</option>
                  <option value="custom">Пользовательское</option>
                </select>
                <button
                  type="button"
                  class="btn-remove"
                  on:click={() => removeValidationRule(index)}
                  title="Удалить правило"
                >
                  ✕
                </button>
              </div>
              
              <div class="rule-content">
                <input
                  type="text"
                  value={rule.message}
                  on:input={(e) => updateValidationRule(index, 'message', e.target.value)}
                  placeholder="Сообщение об ошибке"
                  class="form-input"
                />
                
                {#if rule.type === 'pattern'}
                  <input
                    type="text"
                    value={rule.pattern || ''}
                    on:input={(e) => updateValidationRule(index, 'pattern', e.target.value)}
                    placeholder="Регулярное выражение"
                    class="form-input"
                  />
                {:else if rule.type !== 'required' && rule.type !== 'email'}
                  <input
                    type="text"
                    value={rule.value || ''}
                    on:input={(e) => updateValidationRule(index, 'value', e.target.value)}
                    placeholder="Значение"
                    class="form-input"
                  />
                {/if}
              </div>
            </div>
          {/each}
          
          <button type="button" class="btn-add" on:click={addValidationRule}>
            + Добавить правило валидации
          </button>
        </div>
      </div>
    {:else if activeTab === 'advanced'}
      <div class="tab-panel">
        <div class="form-group">
          <label for="field-pattern">Паттерн (регулярное выражение)</label>
          <input
            id="field-pattern"
            type="text"
            value={localField.pattern || ''}
            on:input={(e) => handleChange('pattern', e.target.value)}
            placeholder="^[a-zA-Z0-9]+$"
            class="form-input"
          />
          <small class="form-help">Используется для валидации ввода</small>
        </div>

        <div class="form-group">
          <label for="field-autocomplete">Автозаполнение</label>
          <select
            id="field-autocomplete"
            value={localField.autocomplete || ''}
            on:change={(e) => handleChange('autocomplete', e.target.value)}
            class="form-select"
          >
            <option value="">Выключено</option>
            <option value="on">Включено</option>
            <option value="name">Имя</option>
            <option value="email">Email</option>
            <option value="tel">Телефон</option>
            <option value="url">URL</option>
            <option value="off">Отключено</option>
          </select>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .field-editor {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .editor-header {
    padding: 1rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .field-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .field-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .field-details h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }

  .field-details p {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
  }

  .editor-tabs {
    display: flex;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .tab-button {
    flex: 1;
    padding: 0.75rem;
    border: none;
    background: none;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    border-bottom: 2px solid transparent;
  }

  .tab-button:hover {
    color: #374151;
    background: #f3f4f6;
  }

  .tab-button.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
    background: white;
  }

  .editor-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .tab-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .form-input,
  .form-textarea,
  .form-select {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }

  .form-input:focus,
  .form-textarea:focus,
  .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }

  .form-help {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .checkbox-label input[type="checkbox"] {
    margin: 0;
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .option-item {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .option-value {
    flex: 1;
  }

  .option-label {
    flex: 2;
  }

  .btn-remove {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    transition: all 0.15s ease-in-out;
  }

  .btn-remove:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  .btn-add {
    background: #f3f4f6;
    border: 1px dashed #d1d5db;
    color: #6b7280;
    cursor: pointer;
    padding: 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: all 0.15s ease-in-out;
  }

  .btn-add:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .validation-rules {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .validation-rule {
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    padding: 1rem;
    background: #f9fafb;
  }

  .rule-header {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .rule-header .form-select {
    flex: 1;
  }

  .rule-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* Адаптивность */
  @media (max-width: 768px) {
    .editor-tabs {
      flex-wrap: wrap;
    }

    .tab-button {
      flex: none;
      min-width: 80px;
    }

    .option-item {
      flex-direction: column;
      align-items: stretch;
    }

    .rule-header {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
