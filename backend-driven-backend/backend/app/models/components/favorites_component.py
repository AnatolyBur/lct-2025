from django.db import models
from garpix_page.models import BaseComponent


class FavoritesTeaserComponent(BaseComponent):
    """
    Блок «Избранное».
    Режим 1 — тизер, Режим 2 — мини-лист карточек (ручной).
    """

    MODE_CHOICES = (
        ('teaser', 'Тизер с призывом'),
        ('list', 'Мини-список карточек'),
    )
    mode = models.CharField('Режим', max_length=10, choices=MODE_CHOICES, default='teaser')

    # Общие поля
    subtitle = models.CharField('Подзаголовок', max_length=200, blank=True, default='')

    # Поля для тизера
    teaser_text = models.CharField('Текст кнопки', max_length=64, blank=True, default='Перейти в избранное')
    teaser_url = models.CharField('Ссылка кнопки', max_length=255, blank=True, default='/favorites/')

    # Поля для списка
    columns = models.PositiveSmallIntegerField('Карточек в ряд (desktop)', default=4)
    limit = models.PositiveSmallIntegerField('Макс. карточек', default=8)

    template = 'pages/components/favorites_teaser.html'

    class Meta:
        verbose_name = 'Избранное (тизер/список)'
        verbose_name_plural = 'Избранное (тизер/список)'


class FavoriteTeaserItem(models.Model):
    component = models.ForeignKey(
        FavoritesTeaserComponent,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Компонент'
    )
    title = models.CharField('Название', max_length=150)
    url = models.CharField('Ссылка', max_length=255, default='/')
    image = models.ImageField('Изображение', upload_to='ui/fav/', blank=True, null=True)
    price_value = models.DecimalField('Цена', max_digits=12, decimal_places=2, blank=True, null=True)
    price_currency = models.CharField('Валюта', max_length=8, default='₽')
    address = models.CharField('Адрес/Регион', max_length=120, blank=True, default='')
    order = models.PositiveIntegerField('Порядок', default=0)

    class Meta:
        ordering = ('order', 'id')
        verbose_name = 'Карточка избранного'
        verbose_name_plural = 'Карточки избранного'

    def __str__(self):
        return self.title
