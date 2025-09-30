import { AxiosResponse } from 'axios'
import { BaseApi } from '@/api/abstract'

type TBaseQueryParams = Record<string, any>

type TBaseQueryData = Record<string, any>

type TPropertiesFrom<T> = { [key in keyof T]: T[key] }

type TQueryParams<T = unknown> = Partial<TPropertiesFrom<T>> & TBaseQueryParams

type TQueryData<T = unknown> = Partial<TPropertiesFrom<T>> & TBaseQueryData

type TServerResponse<T> = Promise<AxiosResponse<T>> 

interface IDirectionApi {
    apiService: BaseApi
}

export type {
  TBaseQueryParams,
  TBaseQueryData,
  TQueryParams,
  TQueryData,
  TServerResponse,
  IDirectionApi
}
