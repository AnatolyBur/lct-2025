from django.db import models
from garpix_page.models import BaseListPage, BasePage


class NewsListPage(BaseListPage):
    """
    Список новостей.
    """

    template = 'pages/news_list.html'
    paginate_by = 10

    def get_queryset(self, request=None):
        return NewsPost.objects.filter(parent=self)

    class Meta:
        verbose_name = 'Новости (список)'
        verbose_name_plural = 'Новости (списки)'


class NewsPost(BasePage):
    """
    Детальная новость.
    """

    template = 'pages/news_post.html'
    content = models.TextField('Текст', blank=True, default='')
    cover = models.ImageField(
        'Обложка', upload_to='news/', blank=True, null=True
    )

    class Meta:
        verbose_name = 'Новость'
        verbose_name_plural = 'Новости'
