from django.contrib import admin
from .models import *
# Register your models here.
admin.site.register(CustomUser)
admin.site.register(FitnessGoal)
admin.site.register(Activity)
admin.site.register(Progress)
admin.site.register(ActivityLog)
