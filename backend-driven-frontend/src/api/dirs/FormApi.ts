import { AxiosResponse } from 'axios'
import { BaseApi } from '../abstract'
import { 
  IFormApi, 
  IFormReq,
  IFormRes,
  IFormsRes,
  IFormSubmitRes,
  IFormEventsRes,
  IFormEventRes,
  IFormSubmissionsRes,
  IFormSubmissionRes,
  IFormEventLogsRes
} from '../types/dirs/formApi'
import { 
  FormBuilderConfig, 
  FormEvent, 
  FormSubmission, 
  FormEventLog,
  FormSubmitResponse
} from '@/types/formBuilder'

class FormApi implements IFormApi {
  apiService: BaseApi

  constructor(apiService: BaseApi) {
    this.apiService = apiService
  }

  // Основные операции с формами
  async getForms(): Promise<AxiosResponse<FormBuilderConfig[]>> {
    return this.apiService.get('/api/forms/')
  }

  async getFormConfig(id: number): Promise<AxiosResponse<FormBuilderConfig>> {
    return this.apiService.get(`/api/forms/${id}/`)
  }

  async createForm(form: Partial<FormBuilderConfig>): Promise<AxiosResponse<FormBuilderConfig>> {
    return this.apiService.post('/api/forms/', form)
  }

  async updateForm(id: number, form: FormBuilderConfig): Promise<AxiosResponse<FormBuilderConfig>> {
    return this.apiService.put(`/api/forms/${id}/`, form)
  }

  async deleteForm(id: number): Promise<AxiosResponse<void>> {
    return this.apiService.delete(`/api/forms/${id}/`)
  }

  // Отправка формы
  async submitForm(id: number, data: Record<string, any>): Promise<AxiosResponse<FormSubmitResponse>> {
    return this.apiService.post(`/api/forms/${id}/submit/`, data)
  }

  // События формы
  async getFormEvents(formId: number): Promise<AxiosResponse<FormEvent[]>> {
    return this.apiService.get(`/api/forms/${formId}/events/`)
  }

  async createFormEvent(formId: number, event: Partial<FormEvent>): Promise<AxiosResponse<FormEvent>> {
    return this.apiService.post(`/api/forms/${formId}/events/`, event)
  }

  async updateFormEvent(formId: number, eventId: number, event: Partial<FormEvent>): Promise<AxiosResponse<FormEvent>> {
    return this.apiService.put(`/api/forms/${formId}/events/${eventId}/`, event)
  }

  async deleteFormEvent(formId: number, eventId: number): Promise<AxiosResponse<void>> {
    return this.apiService.delete(`/api/forms/${formId}/events/${eventId}/`)
  }

  // Отправки формы
  async getFormSubmissions(formId: number): Promise<AxiosResponse<FormSubmission[]>> {
    return this.apiService.get(`/api/forms/${formId}/submissions/`)
  }

  async getFormSubmission(formId: number, submissionId: number): Promise<AxiosResponse<FormSubmission>> {
    return this.apiService.get(`/api/forms/${formId}/submissions/${submissionId}/`)
  }

  // Логи событий
  async getFormEventLogs(formId: number, eventId?: number): Promise<AxiosResponse<FormEventLog[]>> {
    const url = eventId 
      ? `/api/forms/${formId}/events/${eventId}/logs/`
      : `/api/forms/${formId}/logs/`
    return this.apiService.get(url)
  }
}

export default FormApi
