import { IDirectionApi, TServerResponse } from '../abstract'

export interface IContextApi extends IDirectionApi {
  getContext(params: IContextReq): IContextRes
}

export interface IContextReq {
  slug: string
}

export interface IContextRes extends TServerResponse<IContextDto> {}

type TLayout = {
  id: number,
  name: string,
  code: string
}

export interface IContextDto {
  page_model: string,
  init_state: {
    object: {
      id: number,
      layout: TLayout,
      seo_title: string,
      seo_keywords: string,
      seo_description: string,
      seo_author: string,
      seo_og_type: string,
      title: string,
      is_active: boolean,
      display_on_sitemap: boolean,
      slug: string,
      created_at: string,
      updated_at: string,
      seo_image: string | null,
      url: string,
      draft_data: string | null,
      parent: number | null,
      sites: number[]
    },
    subpages: {},
    components: [],
    global: {}
  },
  is_draft: boolean,
  has_draft: boolean
}
