import { FC, ReactElement } from 'react'
import { ContextApiTypes } from "@/api/types/dirs"
import { ILayout } from '@/structure/Layout'

export interface IScript {
  source: string
  defer?: boolean
  async?: boolean
  content?: string
}

// export interface IPageBuilder {
//   pageContext?: ContextApiTypes.IContextDto
//   getPageId(): string
//   updateContext(pageId?: string): Promise<void>
//   getUILayout(): Promise<ReactElement | null>
// }
