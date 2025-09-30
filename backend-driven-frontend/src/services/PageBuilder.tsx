import { createElement, DOMAttributes, ReactElement } from 'react'
import ReactDom from 'react-dom'
import * as Widgets from '@/apps'
import { ContextStore, RootStore } from '@/store'
import { IPageBuilder, IMeta } from './types/pageBuilder'
import { ContextApiTypes } from '@/api/types/dirs'
import { Layout } from '@/apps'

class PageBuilder implements IPageBuilder {
  private _slug: string = ''
  private _createdMetaElements: ReactElement<DOMAttributes<HTMLMetaElement>>[] = []
  contextStore: ContextStore
  pageContext?: ContextApiTypes.IContextDto

  constructor () {
    this.contextStore = RootStore.contextStore
  }

  private _setMetaOnPage(metaData: IMeta[]) {
    const getClearedMetaDataItem = (metaDataItem: IMeta): DOMAttributes<HTMLMetaElement> => {
      let metaDataItemCleared: DOMAttributes<HTMLMetaElement>

      for (let attr in metaDataItem) {
        // @ts-ignore
        if (!metaItem[attr]) {
          // @ts-ignore
          delete metaItem[attr] 
        }
      }

      metaDataItemCleared = metaDataItem as DOMAttributes<HTMLMetaElement>

      return metaDataItemCleared
    }

    const insertMetaDataItem = (metaDataItem: DOMAttributes<HTMLMetaElement>): void => {
      this._createdMetaElements.push(
        createElement<DOMAttributes<HTMLMetaElement>, HTMLMetaElement>(
          'meta',
          metaDataItem
        )
      )

      ReactDom.createPortal(
        this._createdMetaElements[this._createdMetaElements.length + 1], 
        document.head
      )
    }

    metaData.forEach(metaDataItem => {
      insertMetaDataItem(getClearedMetaDataItem(metaDataItem))
    })
  }

  private _clearMetaOnPage() {
    this._createdMetaElements.forEach((el: any) => {
      ReactDom.unmountComponentAtNode(el)
    })

    this._createdMetaElements = []
  }

  getPageSlug() {
    return this._slug
  }

  async updateContext(slug: string = this._slug) {
    this.pageContext = await this.contextStore.getContext({ slug })
  }

  /**
   * 1. Updates page context from backend.
   * 2. Builds UI layout from page context.
   * 3. Inserts metadata from page context.
   * @returns React component contains UI layout
   */
  async getUILayout() {
    if (!this.pageContext) {
      await this.updateContext()

      if (!this.pageContext) {
        return null
      }
    }

    if (!this.pageContext.meta) {
      this._clearMetaOnPage()
      this._setMetaOnPage(this.pageContext.meta)
    }

    const content = this.pageContext?.content

    return <Layout content={content} />
  }
}

export default PageBuilder
