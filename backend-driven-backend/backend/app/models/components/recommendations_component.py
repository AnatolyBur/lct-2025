from django.db import models
from garpix_page.models import BaseComponent


class RecommendationsComponent(BaseComponent):
    """
    Блок "Рекомендовано для вас".
    """

    subtitle = models.CharField('Подзаголовок', max_length=200, blank=True, default='')
    columns = models.PositiveSmallIntegerField('Карточек в ряд', default=5)
    limit = models.PositiveSmallIntegerField('Макс. карточек к показу', default=15)

    template = 'pages/components/recommendations.html'

    class Meta:
        verbose_name = 'Рекомендации'
        verbose_name_plural = 'Рекомендации'


class RecommendationItem(models.Model):
    component = models.ForeignKey(
        RecommendationsComponent,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Компонент'
    )
    title = models.CharField('Название', max_length=150)
    url = models.CharField('Ссылка', max_length=255, default='/')
    image = models.ImageField('Изображение', upload_to='ui/reco/', blank=True, null=True)

    # Опциональные поля цены/адреса, чтобы карточка выглядела как товар
    price_value = models.DecimalField('Цена', max_digits=12, decimal_places=2, blank=True, null=True)
    price_currency = models.CharField('Валюта', max_length=8, default='₽')
    address = models.CharField('Адрес/Регион', max_length=120, blank=True, default='')
    is_favorite = models.BooleanField('Отмечено избранным', default=False)

    order = models.PositiveIntegerField('Порядок', default=0)

    class Meta:
        ordering = ('order', 'id')
        verbose_name = 'Карточка рекомендации'
        verbose_name_plural = 'Карточки рекомендаций'

    def __str__(self):
        return self.title
