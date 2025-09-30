from django.db import models
from garpix_page.models import BasePage


class ProductPage(BasePage):
    """
    Карточка товара.
    """

    template = 'pages/product.html'
    product_category = models.ForeignKey(
        'app.Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name='Категория'
    )
    price = models.DecimalField('Цена', max_digits=12, decimal_places=2)
    currency = models.CharField('Валюта', max_length=8, default='RUB')
    short_description = models.CharField(
        'Короткое описание', max_length=255, blank=True, default=''
    )
    description = models.TextField('Описание', blank=True, default='')

    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'


class ProductImage(models.Model):
    """
    Изображения товара.
    """

    product = models.ForeignKey(
        ProductPage, on_delete=models.CASCADE, related_name='images'
    )
    image = models.ImageField(upload_to='products/')
    alt = models.CharField(
        max_length=255, blank=True, default='', verbose_name='ALT-текст'
    )
    sort = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Изображение товара'
        verbose_name_plural = 'Изображения товара'
        ordering = ('sort', 'id')
