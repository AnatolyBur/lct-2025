import { BaseApi } from "../abstract"
import { ContextApiTypes } from "../types/dirs"

class ContextApi implements ContextApiTypes.IContextApi {
  apiService: BaseApi

  constructor (apiService: BaseApi) {
    this.apiService = apiService
  }

  getContext = async ({ slug }: ContextApiTypes.IContextReq) => {
    const res = await this.apiService.get<ContextApiTypes.IContextReq, ContextApiTypes.IContextDto>(`/api/page/${slug}`)

    return res
  }
}

export default ContextApi
