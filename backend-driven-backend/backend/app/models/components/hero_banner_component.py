from django.db import models
from garpix_page.models import BaseComponent


class HeroBannerComponent(BaseComponent):
    """
    Большой баннер на главной: заголовок, описание, кнопка, картинка.
    """

    subtitle = models.TextField('Описание', blank=True, default='')
    cta_text = models.CharField('Текст кнопки', max_length=64, blank=True, default='')
    cta_url = models.CharField('Ссылка кнопки', max_length=255, blank=True, default='/')

    image = models.ImageField('Картинка (desktop)', upload_to='ui/hero/', blank=True, null=True)
    image_mobile = models.ImageField('Картинка (mobile)', upload_to='ui/hero/', blank=True, null=True)

    ALIGN_CHOICES = (
        ('left', 'Текст слева'),
        ('right', 'Текст справа'),
        ('center', 'Текст по центру'),
    )
    align = models.CharField('Выравнивание контента', max_length=10, choices=ALIGN_CHOICES, default='left')

    dark_text = models.BooleanField('Тёмный текст', default=False, help_text='Если фон светлый, выключите.')
    height = models.PositiveSmallIntegerField('Высота (vh)', default=36, help_text='Напр., 36 = 36vh')

    template = 'pages/components/hero_banner.html'

    class Meta:
        verbose_name = 'Большой баннер'
        verbose_name_plural = 'Большие баннеры'
