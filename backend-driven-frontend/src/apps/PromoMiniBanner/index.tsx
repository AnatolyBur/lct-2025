import { FC } from 'react'
import style from './index.module.scss'

const PromoMiniBanner: FC = () => {
  return (
    <section className={style.widget}>
      <h2 className={style.title}>
        Все для бизнеса
      </h2>
      <p className={style.description}>
        Тест
      </p>
      <button className={style.btn}>
        <span className={style.btn__icon}>
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 2.6a8 8 0 1 1 0 16 8 8 0 0 1 0-16m0 1.48a6.52 6.52 0 1 0 0 13.04A6.52 6.52 0 0 0 8 4.08m0 2.08a4.44 4.44 0 1 1 0 8.88 4.44 4.44 0 0 1 0-8.88m0 1.47a2.97 2.97 0 1 0 0 5.94 2.97 2.97 0 0 0 0-5.94" fill="black"/>
          </svg>
        </span>
        <span className={style.btn__text}>
          Искать в Бизнес 360
        </span>   
      </button>
    </section>
  )
}

export default PromoMiniBanner
