import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, Method } from 'axios'
import { TQueryData, TQueryParams } from '@/api/types/abstract'

const AUTH_TOKEN_KEY = 'auth_token'

abstract class BaseApi {
  url: string
  getAuthToken: () => string | null
  setAuthToken: (token: string) => void
  removeAuthToken: () => boolean

  constructor (url: string) {
    this.url = url

    if (url === null || url === undefined) {
      console.error(`API URL isn't set`)
    }

    this.getAuthToken = () => {
      return localStorage.getItem(AUTH_TOKEN_KEY)
    }
    this.setAuthToken = (token: string) => {
      localStorage.setItem(AUTH_TOKEN_KEY, token)
    }
    this.removeAuthToken = () => {
      try {
        localStorage.removeItem(AUTH_TOKEN_KEY)

        return true
      } catch {
        return false
      }
    }
  }

  axiosOverride = (axios: AxiosInstance): AxiosInstance => {
    const Token = this.getAuthToken()
    axios.defaults.headers.common.Authorization = `Token ${Token}`

    return axios
  }

  asyncOverride = async (axios: AxiosInstance): Promise<AxiosInstance> => {
    return axios
  }

  post = async <TRequest = unknown, TResponse = TRequest>(url: string, params: TQueryData<TRequest>, axiosParams: AxiosRequestConfig = {}) => {
    return await this.send<TRequest, TResponse>(url, 'post', params, axiosParams)
  }

  get = async <TRequest = unknown, TResponse = TRequest>(url: string, params: TQueryParams<TRequest> = {}, axiosParams: AxiosRequestConfig = {}) => {
    const base_url = this.url
    const newAxios = this.axiosOverride(axios)
    const _axios = await this.asyncOverride(newAxios)
    const res = await _axios.request<TRequest, AxiosResponse<TResponse>>({
      method: 'get',
      params,
      url: `${base_url}${url}`,
      ...axiosParams
    })

    return res
  }

  put = async <TRequest = unknown, TResponse = TRequest>(url: string, params: TQueryData<TRequest> = {}, axiosParams: AxiosRequestConfig = {}) => {
    return await this.send<TRequest, TResponse>(url, 'put', params, axiosParams)
  }

  patch = async <TRequest = unknown, TResponse = TRequest>(url: string, params: TQueryData<TRequest> = {}, axiosParams: AxiosRequestConfig = {}) => {
    return await this.send<TRequest, TResponse>(url, 'patch', params, axiosParams)
  }

  delete = async <TRequest = unknown, TResponse = TRequest>(url: string, params: TQueryData<TRequest> = {}, axiosParams: AxiosRequestConfig = {}) => {
    return await this.send<TRequest, TResponse>(url, 'delete', params, axiosParams)
  }

  send = async <TRequest = unknown, TResponse = unknown>(url: string, method: Method, params: TQueryData<TRequest>, axiosParams: AxiosRequestConfig = {}) => {
    const base_url = this.url || ''
    const newAxios = this.axiosOverride(axios)
    const _axios = await this.asyncOverride(newAxios)
    const res = await _axios.request<TRequest, AxiosResponse<TResponse>>({
      method,
      data: params,
      url: `${base_url}${url}`,
      ...axiosParams
    })

    return res
  }
}

export default BaseApi
