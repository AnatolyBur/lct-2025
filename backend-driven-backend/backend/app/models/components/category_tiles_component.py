from django.db import models
from garpix_page.models import BaseComponent


class CategoryTilesComponent(BaseComponent):
    """
    Плашки категорий (иконка + заголовок + ссылка).
    """

    columns = models.PositiveSmallIntegerField('Количество колонок', default=8)

    template = 'pages/components/category_tiles.html'

    class Meta:
        verbose_name = 'Категорийные плашки'
        verbose_name_plural = 'Категорийные плашки'


class CategoryTileItem(models.Model):
    component = models.ForeignKey(
        CategoryTilesComponent,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Компонент'
    )
    title = models.CharField('Название', max_length=80)
    url = models.CharField('Ссылка', max_length=255, default='/')
    icon = models.ImageField('Иконка', upload_to='ui/category_tiles/', blank=True, null=True)
    order = models.PositiveIntegerField('Порядок', default=0)

    class Meta:
        ordering = ('order', 'id')
        verbose_name = 'Плашка'
        verbose_name_plural = 'Плашки'

    def __str__(self):
        return self.title
