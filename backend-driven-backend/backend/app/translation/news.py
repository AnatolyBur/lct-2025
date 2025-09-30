from modeltranslation.translator import TranslationOptions, register
from ..models import NewsListPage, NewsPost


@register(NewsListPage)
class NewsListPageTranslationOptions(TranslationOptions):
    fields = ()


@register(NewsPost)
class NewsPostTranslationOptions(TranslationOptions):
    fields = ('content',)


