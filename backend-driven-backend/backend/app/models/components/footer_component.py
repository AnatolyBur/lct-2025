from django.db import models
from garpix_page.models import BaseComponent


class FooterLinksComponent(BaseComponent):
    """
    Футер: группы ссылок + копирайт.
    Рендерится в templates/pages/components/footer.html
    """

    copyright_text = models.CharField(
        'Копирайт/подвал',
        max_length=255,
        default='© 2025 Компания'
    )
    show_socials = models.BooleanField('Показывать соцсети', default=False)

    template = 'pages/components/footer.html'

    class Meta:
        verbose_name = 'Футер'
        verbose_name_plural = 'Футеры'


class FooterLinkGroup(models.Model):
    component = models.ForeignKey(
        FooterLinksComponent,
        on_delete=models.CASCADE,
        related_name='groups',
        verbose_name='Компонент'
    )
    title = models.CharField('Заголовок группы', max_length=120)
    order = models.PositiveIntegerField('Порядок', default=0)

    class Meta:
        ordering = ('order', 'id')
        verbose_name = 'Группа ссылок'
        verbose_name_plural = 'Группы ссылок'

    def __str__(self):
        return self.title


class FooterLinkItem(models.Model):
    group = models.ForeignKey(
        FooterLinkGroup,
        on_delete=models.CASCADE,
        related_name='links',
        verbose_name='Группа'
    )
    title = models.CharField('Название ссылки', max_length=120)
    url = models.CharField('URL', max_length=255)
    is_external = models.BooleanField('Открывать в новой вкладке', default=False)
    order = models.PositiveIntegerField('Порядок', default=0)

    class Meta:
        ordering = ('order', 'id')
        verbose_name = 'Ссылка футера'
        verbose_name_plural = 'Ссылки футера'

    def __str__(self):
        return self.title
