// Типы для работы с страницами GarpixCMS

export interface BasePageField {
  name: string;
  type: 'CharField' | 'TextField' | 'SlugField' | 'BooleanField' | 'DateTimeField' | 'ForeignKey' | 'ManyToManyField' | 'FileField';
  max_length?: number;
  required: boolean;
  help_text?: string;
  verbose_name?: string;
  choices?: Array<{value: string, label: string}>;
  default_value?: any;
  is_translated?: boolean;
  uniqueKey?: string;
}

export interface Language {
  code: string;
  name: string;
}

export interface TranslationInfo {
  has_translations: boolean;
  languages: Language[];
  translated_fields: string[];
}

export interface PageMetadata {
  fields: BasePageField[];
  model_name?: string;
  app_label?: string;
  verbose_name?: string;
  translation?: TranslationInfo;
  // Для API ответа с доступными типами страниц
  available_page_types?: Array<{
    model_name: string;
    app_label: string;
    verbose_name: string;
    fields: BasePageField[];
    translation: TranslationInfo;
  }>;
  default_model?: string;
}

export interface PageData {
  id?: number;
  title: string;
  slug: string;
  content?: string;
  is_published?: boolean;
  is_active?: boolean;
  page_type?: string;
  sites?: number[]; // Массив ID сайтов
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Для дополнительных полей
}

export interface Component {
  id: string;
  name: string;
  title?: string; // Добавляем поле title
  type: string;
  component_type?: string; // Добавляем поле component_type
  config: Record<string, any>;
  fields: BasePageField[];
}

export interface PageFormData {
  page_data: PageData;
  components: Component[];
}

// Типы для системы раскладок
export interface LayoutZone {
  id: string;
  name: string;
  type: 'column' | 'row' | 'grid' | 'flex';
  width?: number; // для колонок
  height?: number; // для строк
  flex?: number; // для flex элементов
  grid_template?: string; // для grid
  components: LayoutComponent[];
}

export interface LayoutComponent {
  id: string;
  component_id: string;
  component: Component;
  config: Record<string, any>;
  position: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
}

export interface Layout {
  id: string;
  name: string;
  description?: string;
  zones: LayoutZone[];
  created_at?: string;
  updated_at?: string;
}

export interface PageLayout {
  page_id: number;
  layout_id: string;
  layout: Layout;
  custom_zones?: LayoutZone[]; // для кастомизации конкретной страницы
}

// === Типы для работы с компонентами ===

export interface ComponentInstance {
  id: number;
  component_id: string;
  component: Component;
  data: Record<string, any>; // Данные компонента
  // Доп. поля, приходящие с бэкенда для страниц
  view_order?: number;
  page_id?: number;
  created_at?: string;
  updated_at?: string;
  // Обогащенные данные для отображения
  fieldDisplayNames?: Record<string, string>; // Человеко-читаемые названия полей
}

export interface ComponentMetadata {
  fields: BasePageField[];
  component_name: string;
  component_type: string;
  config: Record<string, any>;
}

export interface ComponentFormData {
  component_instance: ComponentInstance;
  component_metadata: ComponentMetadata;
}
