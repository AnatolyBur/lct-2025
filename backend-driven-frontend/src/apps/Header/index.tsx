import { FC, useState, useEffect, useRef } from 'react'
import NavList from './NavList'
import style from './index.module.scss'

const Header: FC<Record<string, string>> = ({ props }) => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const categoriesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false)
      }
    }

    if (isCategoriesOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCategoriesOpen])

  const categories = [
    { id: 1, name: 'Транспорт', icon: '🚗', subcategories: ['Автомобили', 'Мотоциклы', 'Водный транспорт', 'Запчасти'] },
    { id: 2, name: 'Недвижимость', icon: '🏠', subcategories: ['Квартиры', 'Дома', 'Коммерческая', 'Участки'] },
    { id: 3, name: 'Работа', icon: '💼', subcategories: ['Вакансии', 'Резюме', 'Удаленная работа'] },
    { id: 4, name: 'Услуги', icon: '🔧', subcategories: ['Ремонт', 'Красота', 'Образование', 'Медицина'] },
    { id: 5, name: 'Личные вещи', icon: '👕', subcategories: ['Одежда', 'Обувь', 'Аксессуары', 'Часы'] },
    { id: 6, name: 'Дом и дача', icon: '🛋️', subcategories: ['Мебель', 'Бытовая техника', 'Инструменты', 'Растения'] },
    { id: 7, name: 'Электроника', icon: '📱', subcategories: ['Телефоны', 'Компьютеры', 'Фото', 'Игры'] },
    { id: 8, name: 'Хобби и спорт', icon: '⚽', subcategories: ['Спорт', 'Музыка', 'Книги', 'Коллекционирование'] },
    { id: 9, name: 'Животные', icon: '🐕', subcategories: ['Собаки', 'Кошки', 'Птицы', 'Рыбки'] },
    { id: 10, name: 'Бизнес', icon: '💼', subcategories: ['Оборудование', 'Готовый бизнес', 'Франшизы'] }
  ]
  return (
    <header className={style.widget}>
      <div className={style.container}>
        <div className={style.upside}>
          <div className={style.upside__container}>
            <div className={style.upsideLeft}>
              <nav className={style.upsideLeftNav}>
                <ul className={style.upsideLeftNav__list}>
                  <li className={style.upsideLeftNav__item}>
                    <button className={style.upsideLeftNav__text} type='button'>Пункт</button>
                    <NavList />
                  </li>
                </ul>
              </nav>
            </div>
            <div className={style.upsideRight}>
              <ul className={style.upsideRightNav}>
                <li className={style.upsideRightNav__item}>
                  <a className={style.upsideRightNav__fav} href='test.com'>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.01 3.6a5.15 5.15 0 0 1 7.45 0 5.56 5.56 0 0 1 0 7.68L9.98 19l-7.44-7.69a5.54 5.54 0 0 1 0-7.66 5.1 5.1 0 0 1 7.4 0z" />
                    </svg>
                  </a>
                </li>
                <li className={style.upsideRightNav__item}>
                  <a className={style.upsideRightNav__cart} href='test.com'>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.75 16a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5m9 0a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5M3.35 4H18l-2.35 7.59a3 3 0 0 1-2.59 2.1l-7.79.74a1 1 0 0 1-1.07-.78l-.3-1.34L1 1.41 2.55 1z" />
                    </svg>
                  </a>
                </li>
              </ul>
              <button 
                className={style.upsideRight__authBtn}
                type='button'
              >
                Вход и регистрация
              </button>
              <button
                className={style.upsideRight__advertBtn}
                type='button'
              >
                Разместить объявление
              </button>
            </div>
          </div>
        </div>
        <div className={style.downside}>
          <div className={style.downside__container}>
            <a className={style.downside__logoLink}>
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10.595" cy="5.225" r="3.325" fill="#965EEB"></circle><circle cx="22.245" cy="7.235" r="7.235" fill="#0AF"></circle><circle cx="8.9" cy="18.6" r="8.9" fill="#04E061"></circle><circle cx="24.325" cy="21.005" r="5.375" fill="#FF4053"></circle></svg>
              <svg width="79" height="30" viewBox="0 0 79 30" xmlns="http://www.w3.org/2000/svg"><path d="M11.36.62 2 25.06h5.03l1.92-5.1h9.94l1.93 5.1h4.99L16.5.62h-5.15Zm-.68 14.85 3.27-8.6 3.25 8.6h-6.52Zm21.14 3.29L27.76 7.89h-4.8l6.54 17.17h4.75L40.69 7.9h-4.8l-4.06 10.87Zm14.9-10.87h-4.57v17.17h4.56V7.9Zm-2.3-1.24a3.33 3.33 0 1 0 0-6.65 3.33 3.33 0 0 0 0 6.65Zm11.34-3.34H51.2v4.55h-2.67V12h2.67v7.3c0 4.13 2.28 5.92 5.49 5.92a7.86 7.86 0 0 0 3.15-.62v-4.26c-.54.2-1.11.3-1.7.31-1.39 0-2.4-.54-2.4-2.4V12h4.1V7.9h-4.1V3.31Zm13.7 4.27a8.9 8.9 0 0 0-8.23 5.49 8.9 8.9 0 0 0 0 6.8 8.9 8.9 0 0 0 4.8 4.83 8.9 8.9 0 0 0 3.41.68 8.9 8.9 0 0 0 6.24-15.16 8.9 8.9 0 0 0-6.23-2.64Zm0 13.24a4.33 4.33 0 0 1-4.26-5.17 4.33 4.33 0 0 1 7.85-1.57 4.33 4.33 0 0 1 .73 2.41 4.32 4.32 0 0 1-4.33 4.32v.01Z"></path></svg>
            </a>
            <div className={style.categoriesContainer} ref={categoriesRef}>
              <button 
                className={`${style.downsideCategoriesBtn} ${isCategoriesOpen ? style.downsideCategoriesBtn_active : ''}`}
                type='button'
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                onMouseEnter={() => setIsCategoriesOpen(true)}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12.5 16c1.16 0 2.23-.36 3.11-.97l3 3 .99-1-2.94-2.93A5.5 5.5 0 1 0 12.5 16m0-1.4a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2" />
                  <path d="M7 6H1v1.4h6z" />
                  <path d="M1 10.3h4v1.4H1z" />
                  <path d="M7 14.6H1V16h6z" />
                </svg>
                <span className={style.downsideCategoriesBtn__text}>Все категории</span>
              </button>
              
              {isCategoriesOpen && (
                <div 
                  className={style.categoriesDropdown}
                  onMouseLeave={() => setIsCategoriesOpen(false)}
                >
                  <div className={style.categoriesGrid}>
                    {categories.map((category) => (
                      <div key={category.id} className={style.categoryItem}>
                        <div className={style.categoryHeader}>
                          <span className={style.categoryIcon}>{category.icon}</span>
                          <span className={style.categoryName}>{category.name}</span>
                        </div>
                        <ul className={style.subcategoriesList}>
                          {category.subcategories.map((subcategory, index) => (
                            <li key={index} className={style.subcategoryItem}>
                              <a href="#" className={style.subcategoryLink}>
                                {subcategory}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className={style.downsideSearch}>
              <input className={style.downsideSearch__input} type='search' />
              <button className={style.downsideSearch__submit} type='button'>Найти</button>
            </div>
            <button className={style.downsideAddress}>
              <svg width="12" height="13" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="m3.518 8.457-.006-.005-.006-.005A3.864 3.864 0 0 1 2 5.37C2 3.21 3.81 1.4 6 1.4s4 1.811 4 3.97a3.864 3.864 0 0 1-1.506 3.077l-.006.005-.006.005-.426.339-.426.339-.009.007-.23.183c-.423.333-.945.745-1.384 1.29C5.51 9.981 4.89 9.52 4.4 9.154l-.047-.034-.409-.325-.426-.34Zm3.213 3.608.015-.03c.309-.646.884-1.106 1.54-1.632l.215-.173.853-.678A5.264 5.264 0 0 0 11.4 5.37C11.4 2.43 8.956 0 6 0 3.044 0 .6 2.43.6 5.37c0 1.639.739 3.165 2.046 4.182l.853.678c.745.556 1.414 1.074 1.757 1.803l.014.03c.031.07.06.14.085.214l.01.029c.026.078.048.159.067.242.057.283.284.452.568.452s.512-.17.569-.452c.018-.084.04-.164.067-.242l.01-.03c.025-.072.054-.142.085-.21ZM6.001 7.9a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Zm1-2.4a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" fill="#000"></path></svg>
              <span className={style.downsideAddress__text}>г. Санкт-Петербург</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
