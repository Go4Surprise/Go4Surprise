from django import forms

class UserPreferencesForm(forms.Form):
    adventure = forms.IntegerField(min_value=0, max_value=5)
    culture = forms.IntegerField(min_value=0, max_value=5)
    sports = forms.IntegerField(min_value=0, max_value=5)
    gastronomy = forms.IntegerField(min_value=0, max_value=5)
    nightlife = forms.IntegerField(min_value=0, max_value=5)
    music = forms.IntegerField(min_value=0, max_value=5)