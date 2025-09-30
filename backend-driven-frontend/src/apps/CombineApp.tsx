import { FC, useEffect, useState } from 'react'
import * as Apps from '.'

export interface ICombineApp {
  componentType: string
  componentProps: any
}

// ToDo: типизация
const CombineApp: FC<ICombineApp> = ({ componentType, componentProps }) => {
  const componentMap = {
    header: <Apps.Header {...componentProps} />,
    footer: <Apps.Footer {...componentProps} />,
    product_tiles: <Apps.ProductTiles {...componentProps} />,
    TextComponent: <Apps.TextComponent {...componentProps} />
  }

  return componentMap[componentType]
}

export default CombineApp
