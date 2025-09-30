import { AxiosResponse } from 'axios'
import { IDirectionApi, TServerResponse } from "../abstract"
import { 
  FormBuilderConfig, 
  FormEvent, 
  FormSubmission, 
  FormEventLog,
  FormBuilderApiResponse,
  FormSubmitResponse
} from '@/types/formBuilder'

export interface IFormApi extends IDirectionApi {
  // Основные операции с формами
  getForms(): TServerResponse<FormBuilderConfig[]>
  getFormConfig(id: number): TServerResponse<FormBuilderConfig>
  createForm(form: Partial<FormBuilderConfig>): TServerResponse<FormBuilderConfig>
  updateForm(id: number, form: FormBuilderConfig): TServerResponse<FormBuilderConfig>
  deleteForm(id: number): TServerResponse<void>
  
  // Отправка формы
  submitForm(id: number, data: Record<string, any>): TServerResponse<FormSubmitResponse>
  
  // События формы
  getFormEvents(formId: number): TServerResponse<FormEvent[]>
  createFormEvent(formId: number, event: Partial<FormEvent>): TServerResponse<FormEvent>
  updateFormEvent(formId: number, eventId: number, event: Partial<FormEvent>): TServerResponse<FormEvent>
  deleteFormEvent(formId: number, eventId: number): TServerResponse<void>
  
  // Отправки формы
  getFormSubmissions(formId: number): TServerResponse<FormSubmission[]>
  getFormSubmission(formId: number, submissionId: number): TServerResponse<FormSubmission>
  
  // Логи событий
  getFormEventLogs(formId: number, eventId?: number): TServerResponse<FormEventLog[]>
}

export interface IFormReq {
  id?: number
  form?: Partial<FormBuilderConfig>
  data?: Record<string, any>
  event?: Partial<FormEvent>
  eventId?: number
  submissionId?: number
}

export interface IFormRes extends TServerResponse<FormBuilderConfig> {}
export interface IFormsRes extends TServerResponse<FormBuilderConfig[]> {}
export interface IFormSubmitRes extends TServerResponse<FormSubmitResponse> {}
export interface IFormEventsRes extends TServerResponse<FormEvent[]> {}
export interface IFormEventRes extends TServerResponse<FormEvent> {}
export interface IFormSubmissionsRes extends TServerResponse<FormSubmission[]> {}
export interface IFormSubmissionRes extends TServerResponse<FormSubmission> {}
export interface IFormEventLogsRes extends TServerResponse<FormEventLog[]> {}
