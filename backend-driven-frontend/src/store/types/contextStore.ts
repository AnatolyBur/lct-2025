import { ContextApiTypes } from "@/api/types/dirs"
import { IStoreModule } from "."

export interface IContextStore extends IStoreModule {
  context?: ContextApiTypes.IContextDto
  getContext: ({ page_id }: ContextApiTypes.IContextReq) => Promise<ContextApiTypes.IContextDto>
}
