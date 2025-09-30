// Типы для конструктора форм

export interface FormBuilderField {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'number' | 'tel' | 'url';
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[]; // для select/radio
  position: { x: number; y: number };
  size: { width: number; height: number };
  help_text?: string;
  default_value?: any;
  max_length?: number;
  min_length?: number;
  pattern?: string;
  min?: number;
  max?: number;
  step?: number;
  multiple?: boolean; // для select и file
  accept?: string; // для file
}

export interface SelectOption {
  value: string;
  label: string;
  selected?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min_length' | 'max_length' | 'pattern' | 'min' | 'max' | 'custom';
  message: string;
  value?: any;
  pattern?: string;
}

export interface FormBuilderConfig {
  id?: number;
  title: string;
  form_title: string;
  form_description?: string;
  submit_text: string;
  success_message: string;
  email_notifications: boolean;
  notification_emails: string;
  save_submissions: boolean;
  is_active: boolean;
  form_config: {
    fields: FormBuilderField[];
    layout?: {
      type: 'single' | 'two-column' | 'three-column' | 'custom';
      columns?: number;
      gap?: number;
    };
    styling?: {
      theme?: 'default' | 'modern' | 'minimal';
      colors?: {
        primary?: string;
        secondary?: string;
        background?: string;
        text?: string;
      };
      fonts?: {
        family?: string;
        size?: string;
      };
    };
  };
  created_at?: string;
  updated_at?: string;
}

export interface FormEvent {
  id?: number;
  name: string;
  event_type: 'email' | 'webhook' | 'database' | 'notification' | 'redirect' | 'custom';
  is_active: boolean;
  order: number;
  config: Record<string, any>;
  conditions: FormEventCondition[];
  created_at?: string;
  updated_at?: string;
}

export interface FormEventCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface FormSubmission {
  id: number;
  submitted_data: Record<string, any>;
  submitted_at: string;
  ip_address?: string;
  user?: string;
}

export interface FormEventLog {
  id: number;
  event_name: string;
  event_type: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  execution_time?: number;
  created_at: string;
}

// Типы для drag & drop
export interface DragItem {
  type: 'field' | 'existing-field';
  field?: FormBuilderField;
  fieldType?: string;
  index?: number;
}

export interface DropZone {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  accepts: string[];
}

// Типы для предварительного просмотра
export interface FormPreviewData {
  form_config: FormBuilderConfig;
  submitted_data?: Record<string, any>;
  errors?: Record<string, string>;
}

// Типы для API ответов
export interface FormBuilderApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  errors?: Record<string, string>;
}

export interface FormSubmitResponse {
  success: boolean;
  message: string;
  submission_id?: number;
  events?: Array<{
    event_name: string;
    event_type: string;
    status: string;
    message: string;
  }>;
  redirect_url?: string;
}

// Типы для настроек полей
export interface FieldSettings {
  basic: {
    label: string;
    name: string;
    placeholder?: string;
    help_text?: string;
    required: boolean;
    default_value?: any;
  };
  validation: {
    rules: ValidationRule[];
  };
  appearance: {
    size: 'small' | 'medium' | 'large';
    width: 'full' | 'half' | 'third' | 'quarter';
    alignment: 'left' | 'center' | 'right';
  };
  advanced: {
    readonly: boolean;
    disabled: boolean;
    autocomplete?: string;
    pattern?: string;
  };
}

// Типы для событий
export interface EmailEventConfig {
  recipients: string[];
  subject: string;
  template?: string;
  from_email?: string;
}

export interface WebhookEventConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  timeout: number;
}

export interface DatabaseEventConfig {
  model: string;
  field_mapping: Record<string, string>;
}

export interface NotificationEventConfig {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  channels: string[];
}

export interface RedirectEventConfig {
  url: string;
  message: string;
}

export interface CustomEventConfig {
  code: string;
  description?: string;
}

// Типы для компонентов конструктора
export interface FormBuilderState {
  currentForm: FormBuilderConfig | null;
  forms: FormBuilderConfig[];
  selectedField: FormBuilderField | null;
  dragItem: DragItem | null;
  previewMode: boolean;
  loading: boolean;
  error: string | null;
}

export interface FormBuilderActions {
  loadForms: () => Promise<void>;
  loadForm: (id: number) => Promise<FormBuilderConfig | undefined>;
  loadFormWithList: (id: number) => Promise<void>;
  saveForm: (form: FormBuilderConfig) => Promise<FormBuilderConfig>;
  createForm: (form: Partial<FormBuilderConfig>) => Promise<FormBuilderConfig>;
  deleteForm: (id: number) => Promise<void>;
  addField: (field: FormBuilderField) => void;
  updateField: (fieldId: string, updates: Partial<FormBuilderField>) => void;
  removeField: (fieldId: string) => void;
  reorderFields: (fieldIds: string[]) => void;
  selectField: (field: FormBuilderField | null) => void;
  setDragItem: (item: DragItem | null) => void;
  setPreviewMode: (enabled: boolean) => void;
  clearError: () => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  hideNotification: () => void;
  loadFormEvents: (formId: number) => Promise<void>;
  createFormEvent: (formId: number, eventData: Partial<FormEvent>) => Promise<FormEvent>;
  updateFormEvent: (formId: number, eventId: number, eventData: Partial<FormEvent>) => Promise<FormEvent>;
  deleteFormEvent: (formId: number, eventId: number) => Promise<void>;
  loadFormSubmissions: (formId: number) => Promise<void>;
  loadFormEventLogs: (formId: number, eventId?: number) => Promise<void>;
}
