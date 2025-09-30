// Утилиты для работы с формами

import type { BasePageField, PageData, TranslationInfo } from '$lib/types/page';

export function createInitialFormData(fields: BasePageField[], translation?: TranslationInfo): PageData {
  const initialData: PageData = {
    title: '',
    slug: '',
    content: '',
    is_published: false,
    is_active: true,
    page_type: 'Page'
  };

  // Поля, которые не должны создаваться в formData (только для отображения)
  const readonlyFields = ['url', 'created_at', 'updated_at'];

  fields.forEach(field => {
    // Пропускаем поля только для чтения
    if (readonlyFields.includes(field.name)) {
      return;
    }
    // Добавляем основное поле
    if (field.default_value !== undefined) {
      initialData[field.name] = field.default_value;
    } else {
      switch (field.type) {
        case 'CharField':
        case 'SlugField':
          initialData[field.name] = '';
          break;
        case 'TextField':
          initialData[field.name] = '';
          break;
        case 'BooleanField':
          initialData[field.name] = false;
          break;
        case 'DateTimeField':
          initialData[field.name] = null;
          break;
        case 'ForeignKey':
          initialData[field.name] = null;
          break;
        case 'ManyToManyField':
          initialData[field.name] = [];
          break;
        default:
          initialData[field.name] = null;
      }
    }

    // Добавляем переводы для переводимых полей
    if (field.is_translated && translation?.languages) {
      translation.languages.forEach(language => {
        const translatedFieldName = `${field.name}_${language.code.replace('-', '_')}`;
        
        if (field.default_value !== undefined) {
          initialData[translatedFieldName] = field.default_value;
        } else {
          switch (field.type) {
            case 'CharField':
            case 'SlugField':
              initialData[translatedFieldName] = '';
              break;
            case 'TextField':
              initialData[translatedFieldName] = '';
              break;
            case 'BooleanField':
              initialData[translatedFieldName] = false;
              break;
            case 'DateTimeField':
              initialData[translatedFieldName] = null;
              break;
            case 'ForeignKey':
              initialData[translatedFieldName] = null;
              break;
            case 'ManyToManyField':
              initialData[translatedFieldName] = [];
              break;
            default:
              initialData[translatedFieldName] = null;
          }
        }
      });
    }
  });

  return initialData;
}

export function validateField(field: BasePageField, value: any): string | null {
  // Проверка обязательности поля
  if (field.required && (value === null || value === undefined || value === '')) {
    return `Поле "${field.name}" обязательно для заполнения`;
  }

  // Проверка максимальной длины для текстовых полей
  if (field.max_length && typeof value === 'string' && value.length > field.max_length) {
    return `Поле "${field.name}" не должно превышать ${field.max_length} символов`;
  }

  // Проверка выбора для полей с choices
  if (field.choices && value !== null && value !== undefined && value !== '') {
    const validChoices = field.choices.map(choice => choice.value);
    if (!validChoices.includes(value)) {
      return `Недопустимое значение для поля "${field.name}"`;
    }
  }

  return null;
}

export function validateFormData(data: PageData, fields: BasePageField[], translation?: TranslationInfo): Record<string, string> {
  const errors: Record<string, string> = {};

  // Нормализуем данные перед валидацией
  const normalizedData = { ...data };
  fields.forEach(field => {
    if (field.is_translated && translation?.languages && (field.type === 'CharField' || field.type === 'SlugField' || field.type === 'TextField')) {
      translation.languages.forEach(language => {
        const translatedFieldName = `${field.name}_${language.code.replace('-', '_')}`;
        if (normalizedData[translatedFieldName] === null || normalizedData[translatedFieldName] === undefined) {
          normalizedData[translatedFieldName] = '';
        }
      });
    }
  });

  // Поля, которые не должны валидироваться (только для отображения)
  const readonlyFields = ['url', 'created_at', 'updated_at'];

  fields.forEach(field => {
    // Пропускаем поля только для чтения
    if (readonlyFields.includes(field.name)) {
      return;
    }

    // Валидация основного поля
    const error = validateField(field, normalizedData[field.name]);
    if (error) {
      errors[field.name] = error;
    }

    // Валидация переводов для переводимых полей (переводы не обязательны)
    if (field.is_translated && translation?.languages) {
      translation.languages.forEach(language => {
        const translatedFieldName = `${field.name}_${language.code.replace('-', '_')}`;
        const translatedValue = normalizedData[translatedFieldName];
        // Для переводимых значений отключаем требование обязательности
        const translatedField: BasePageField = { ...field, required: false };
        const translatedError = validateField(translatedField, translatedValue);
        if (translatedError) {
          errors[translatedFieldName] = translatedError.replace(field.name, `${field.name} (${language.code.toUpperCase()})`);
        }
      });
    }
  });

  return errors;
}

export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Удаляем спецсимволы
    .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
    .replace(/-+/g, '-') // Убираем множественные дефисы
    .trim();
}
