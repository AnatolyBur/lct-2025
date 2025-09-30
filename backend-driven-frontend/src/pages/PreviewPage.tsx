// @ts-nocheck
import { Buffer } from 'buffer'
import { FC, useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CombineApp } from '@/apps'
import style from './tempStyles/simple.module.scss'

export interface IPreviewPage {
  searchParams: URLSearchParams
}

const PreviewPage: FC<IPreviewPage> = ({ searchParams }) => {
  const b64_to_utf8 = (str: string): string => {
    return decodeURIComponent(escape(window.atob(str)));
  }

  if (!searchParams.get('__type_component')) {
    return null
  }

  const typeComponent: string = searchParams.get('__type_component')
  const dataComponentUnparsed: string = b64_to_utf8(searchParams.get('__data_component'))
  const dataComponent: any = dataComponentUnparsed !== '' ? JSON.parse(dataComponentUnparsed) : null

  return (
    <CombineApp
      componentType={typeComponent}
      componentProps={dataComponent}
    />
  )
}



export default PreviewPage;
