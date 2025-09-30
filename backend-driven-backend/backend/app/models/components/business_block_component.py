from django.db import models
from garpix_page.models import BaseComponent


class BusinessBlockComponent(BaseComponent):
    """
    Правая колонка "Всё для бизнеса":
    список карточек с иконкой/заголовком/описанием/ссылкой.
    """

    show_on_mobile = models.BooleanField('Показывать на мобильных', default=True)
    max_items = models.PositiveSmallIntegerField('Макс. элементов', default=6)

    template = 'pages/components/business_block.html'

    class Meta:
        verbose_name = 'Блок "Всё для бизнеса"'
        verbose_name_plural = 'Блоки "Всё для бизнеса"'


class BusinessBlockItem(models.Model):
    component = models.ForeignKey(
        BusinessBlockComponent,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Компонент'
    )
    title = models.CharField('Название', max_length=120)
    description = models.CharField('Короткое описание', max_length=200, blank=True, default='')
    url = models.CharField('Ссылка', max_length=255, default='/')
    icon = models.ImageField('Иконка', upload_to='ui/business/', blank=True, null=True)
    order = models.PositiveIntegerField('Порядок', default=0)
    is_external = models.BooleanField('Открывать в новой вкладке', default=False)

    class Meta:
        ordering = ('order', 'id')
        verbose_name = 'Элемент блока'
        verbose_name_plural = 'Элементы блока'

    def __str__(self):
        return self.title
