from garpix_page.models import BaseListPage


class CatalogPage(BaseListPage):
    """
    Список категорий верхнего уровня.
    """

    template = 'pages/catalog.html'
    paginate_by = 24

    class Meta:
        verbose_name = 'Каталог'
        verbose_name_plural = 'Каталоги'
