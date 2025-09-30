from django.db import models
from garpix_page.models import BaseComponent


class ServicesAndFeaturesComponent(BaseComponent):
    """
    Список сервисов/услуг: иконка, название, описание.
    """

    columns = models.PositiveSmallIntegerField('Колонок на desktop', default=4)
    max_items = models.PositiveSmallIntegerField('Макс. элементов', default=12)
    compact = models.BooleanField('Компактный режим (меньше текста)', default=True)

    template = 'pages/components/services.html'

    class Meta:
        verbose_name = 'Сервисы и услуги'
        verbose_name_plural = 'Сервисы и услуги'


class ServiceItem(models.Model):
    component = models.ForeignKey(
        ServicesAndFeaturesComponent,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Компонент'
    )
    title = models.CharField('Название', max_length=120)
    description = models.CharField('Описание', max_length=200, blank=True, default='')
    url = models.CharField('Ссылка', max_length=255, default='/')
    icon = models.ImageField('Иконка', upload_to='ui/services/', blank=True, null=True)
    order = models.PositiveIntegerField('Порядок', default=0)
    is_external = models.BooleanField('Открывать в новой вкладке', default=False)

    class Meta:
        ordering = ('order', 'id')
        verbose_name = 'Элемент сервиса'
        verbose_name_plural = 'Элементы сервиса'

    def __str__(self):
        return self.title
