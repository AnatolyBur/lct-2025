import { i11n } from "@/types"

export interface IProduct {
  gallery: { 
    preview_uri: string
    alter_text: string
  }[]
  title: string
  price: {
    value: number
    currency: i11n.ECurrencies
  } | null
  address: string | null
  isFavorite: boolean
} 

export interface IProductTiles {
  title: string | null
  productList: IProduct[] | []
}
