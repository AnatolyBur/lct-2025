from modeltranslation.translator import TranslationOptions, register
from garpix_page.models.components.form_component import FormComponent


@register(FormComponent)
class FormComponentTranslationOptions(TranslationOptions):
    fields = ('form_title', 'form_description', 'submit_text', 'success_message')
