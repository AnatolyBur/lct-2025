import { FC, useState } from 'react'
import { IProduct } from '../types'
import { Images } from '@/assets'
import style from './index.module.scss'

const Product: FC<IProduct> = (props: IProduct) => {
  const { gallery, title, price, address, isFavorite } = props
  const [isMenuOpenedState, setIsMenuOpenedState] = useState<boolean>(false)
  const [isFavoriteState, setIsFavoriteState] = useState<boolean>(isFavorite)

  const handleToggleMenu = () => {
    setIsMenuOpenedState(!isMenuOpenedState)
  }

  return (
    <article className={style.productCard}>
      <div className={style.productCardVisual}>
        <a className={style.productCardVisual__link} href='test.com'>
          <img className={style.productCardVisual__image} src={gallery[0].preview_uri} alt={gallery[0].alter_text} />
        </a>
      </div>
      <div className={style.productCardPanel}>
        <div className={style.productCardPanel__info}>
          <h3 className={style.productCardPanel__title}>
            {title}
          </h3>
          {price &&
            <p className={style.productCardPanel__price}>
              {price.value}
            </p>
          }
          <div className={style.productCardPanel__addressBlock}>
            <svg className={style.productCardPanel__addressIcon} width="10" height="12" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="4.59927" cy="4.6" r="1.25455" fill="black"></circle><path d="M0.5 4.44318C0.5 2.27871 2.31612 0.5 4.6 0.5C6.88388 0.5 8.7 2.27871 8.7 4.44318C8.7 5.36368 8.36741 6.19394 7.84004 6.84334L5.44405 9.71032C5.22744 9.96951 5.08532 10.1389 4.96726 10.2575C4.8524 10.373 4.7979 10.4006 4.77138 10.4103C4.6607 10.4507 4.5393 10.4507 4.42862 10.4103C4.4021 10.4006 4.3476 10.373 4.23274 10.2575C4.11468 10.1389 3.97256 9.96951 3.75595 9.71032L1.35996 6.84335C0.832595 6.19395 0.5 5.36369 0.5 4.44318Z" stroke="black" stroke-linejoin="round"></path></svg>
            <address className={style.productCardPanel__address}>
              {address}
            </address>
          </div>
        </div>
        <div className={style.productCardPanel__funcs}>
          <button className={style.productCardPanel__favBtn} type='button'>
            <svg className={style.productCardPanel__icon} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.98204 16.867L3.28133 10.1643C1.69523 8.57776 1.69534 6.00549 3.28133 4.41902C4.86733 2.83255 7.43879 2.83252 9.02478 4.41902L9.98204 5.37656L10.9393 4.41902C12.5253 2.83255 15.0968 2.83252 16.6829 4.41902C18.2688 6.00553 18.2688 8.5778 16.6829 10.1643L9.98204 16.867Z" stroke-width="2.2" stroke-linejoin="round"></path></svg>
          </button>
          <button 
            className={style.productCardPanel__menuBtn} 
            type='button' 
            onClick={handleToggleMenu}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.9231 11.5C13.9231 12.325 14.6154 13 15.4615 13C16.3077 13 17 12.325 17 11.5C17 10.675 16.3077 10 15.4615 10C14.6154 10 13.9231 10.675 13.9231 11.5ZM12.5385 11.5C12.5385 10.675 11.8462 10 11 10C10.1538 10 9.46154 10.675 9.46154 11.5C9.46154 12.325 10.1538 13 11 13C11.8462 13 12.5385 12.325 12.5385 11.5ZM6.53846 10C7.38461 10 8.07692 10.675 8.07692 11.5C8.07692 12.325 7.38461 13 6.53846 13C5.69231 13 5 12.325 5 11.5C5 10.675 5.69231 10 6.53846 10Z" fill="black"></path></svg>
          </button>
          {isMenuOpenedState &&
            <menu className={style.productCardPanelMenu}>
              <ul className={style.productCardPanelMenu__list}>
                <li className={style.productCardPanelMenu__item}>
                  Что-то сделать
                </li>
              </ul>
            </menu>
          }
        </div>
      </div>
      <div></div>
    </article>
  )
}

export default Product
