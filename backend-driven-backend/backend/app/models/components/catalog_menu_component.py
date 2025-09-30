from django.db import models
from garpix_page.models import BaseComponent


class CatalogMenuComponent(BaseComponent):
    """
    Горизонтальное меню каталога.
    """

    menu_code = models.CharField(
        max_length=64,
        default='catalog',
        help_text='Код меню из garpix-menu (поле "code").'
    )
    button_title = models.CharField(
        max_length=64, default='Все категории',
        verbose_name='Текст кнопки'
    )
    max_depth = models.PositiveSmallIntegerField(
        default=2, verbose_name='Макс. глубина вложенности'
    )
    columns = models.PositiveSmallIntegerField(
        default=5, verbose_name='Сколько колонок показывать'
    )
    show_icons = models.BooleanField(
        default=True, verbose_name='Показывать иконки, если заданы'
    )

    template = 'pages/components/catalog_menu.html'

    class Meta:
        verbose_name = 'Меню каталога'
        verbose_name_plural = 'Меню каталога'
