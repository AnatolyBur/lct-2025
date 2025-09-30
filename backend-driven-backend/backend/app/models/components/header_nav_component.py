from django.db import models
from garpix_page.models import BaseComponent


class HeaderNavComponent(BaseComponent):
    """
    Верхнее меню (логотип, поиск, кнопки действий).
    Рендерится в шаблоне pages/components/header_nav.html
    """

    logo = models.ImageField(
        upload_to='ui/', blank=True, null=True, verbose_name='Логотип'
    )
    search_placeholder = models.CharField(
        max_length=100, blank=True, default='Поиск по объявлениям',
        verbose_name='Плейсхолдер поиска'
    )
    show_favorites = models.BooleanField(
        default=True, verbose_name='Показывать "Избранное"'
    )
    show_profile = models.BooleanField(
        default=True, verbose_name='Показывать профиль'
    )
    post_button_text = models.CharField(
        max_length=64, blank=True, default='Разместить объявление',
        verbose_name='Текст кнопки "Разместить объявление"'
    )
    post_button_url = models.CharField(
        max_length=255, blank=True, default='/add',
        verbose_name='Ссылка кнопки "Разместить объявление"'
    )

    template = 'pages/components/header_nav.html'

    class Meta:
        verbose_name = 'Верхнее меню'
        verbose_name_plural = 'Верхнее меню'
