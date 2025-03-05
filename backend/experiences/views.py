from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponseForbidden
from .forms import UserPreferencesForm
from .models import Usuario

# Create your views here.


def user_preferences(request):
    if not request.user.is_authenticated:
        return HttpResponseForbidden("No tienes permiso para acceder a esta página.")
    
    formulario = UserPreferencesForm()
    user = get_object_or_404(Usuario, user=request.user)

    if request.method=='POST':
        formulario = UserPreferencesForm(request.POST)

        if formulario.is_valid():
            user.adventure = formulario.cleaned_data['adventure']
            user.culture = formulario.cleaned_data['culture']
            user.sports = formulario.cleaned_data['sports']
            user.gastronomy = formulario.cleaned_data['gastronomy']
            user.nightlife = formulario.cleaned_data['nightlife']
            user.music = formulario.cleaned_data['music']
            user.save()

            return redirect('')
    
    return render(request, 'user_preferences.html', {'formulario': formulario})