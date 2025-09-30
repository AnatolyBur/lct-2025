from django.db import models
from garpix_page.models import BaseComponent


class PromoAdComponent(BaseComponent):
    """
    Универсальный рекламный блок.
    Варианты:
      - Картинка-баннер (desktop/mobile) со ссылкой
      - Встраиваемый HTML (код виджета/рекламной сети)
    """

    MODE_CHOICES = (
        ('image', 'Баннер-картинка'),
        ('html', 'Встраиваемый HTML'),
    )
    mode = models.CharField('Режим', max_length=8, choices=MODE_CHOICES, default='image')

    # Баннер-картинка
    image = models.ImageField('Картинка (desktop)', upload_to='ui/ads/', blank=True, null=True)
    image_mobile = models.ImageField('Картинка (mobile)', upload_to='ui/ads/', blank=True, null=True)
    link_url = models.CharField('Ссылка', max_length=500, blank=True, default='')
    is_external = models.BooleanField('Открывать в новой вкладке', default=True)
    rel_noopener = models.BooleanField('Добавить rel="noopener nofollow"', default=True)
    aria_label = models.CharField('ARIA label (доступность)', max_length=120, blank=True, default='Рекламный баннер')

    # HTML-режим
    html = models.TextField('HTML-код (скрипт/виджет)', blank=True, default='')

    # Общие настройки
    full_width = models.BooleanField('На всю ширину контейнера', default=True)
    background = models.CharField('Цвет фона (CSS)', max_length=32, blank=True, default='')
    padding_y = models.PositiveSmallIntegerField('Вертикальные отступы (px)', default=12)
    margin_y = models.PositiveSmallIntegerField('Внешние отступы (px)', default=16)

    template = 'pages/components/promo_ad.html'

    class Meta:
        verbose_name = 'Реклама (баннер/HTML)'
        verbose_name_plural = 'Реклама (баннеры/HTML)'
