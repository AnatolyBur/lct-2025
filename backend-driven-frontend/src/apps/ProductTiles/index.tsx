import { FC } from 'react'
import Product from './Product'
import style from './index.module.scss'

const ProductTiles: FC<any> = ({ props }) => {
  const { title, productList } = props
  
  return (
    <section className={style.widget}>
      <header className={style.header}>
        {title &&
          <h2 className={style.title}>
            {title}
          </h2>
        }
      </header>
      <div className={style.container}>
        <ul className={style.productList}>
          {productList && productList.map((product: any) => (
            <li className={style.productItem}>
              <Product 
                gallery={product.gallery}
                title={product.title}
                price={product.price}
                address={product.address}
                isFavorite={product.isFavorite}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default ProductTiles
