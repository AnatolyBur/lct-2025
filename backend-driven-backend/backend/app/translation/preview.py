from modeltranslation.translator import TranslationOptions, register
from ..models import Preview


@register(Preview)
class PreviewTranslationOptions(TranslationOptions):
    fields = ()
