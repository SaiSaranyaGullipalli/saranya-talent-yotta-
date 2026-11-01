
from django.contrib import admin

from .models import (
    Candidate,
    Job,
    Application,
    Interview,
    Offer
)


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = (
        "id", "full_name", "email",
        "phone", "location", "experience_years"
    )
    search_fields = ("full_name", "email", "skills")
    list_filter = ("location",)


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = (
        "id", "title", "department",
        "employment_type", "status"
    )
    search_fields = ("title", "department")
    list_filter = ("status", "employment_type")


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = (
        "id", "candidate", "job",
        "status", "applied_at"
    )
    search_fields = (
        "candidate__full_name",
        "job__title"
    )
    list_filter = ("status",)


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = (
        "id", "application", "interviewer",
        "scheduled_at", "status"
    )
    list_filter = ("status", "interview_type")


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = (
        "id", "application", "offered_ctc",
        "joining_date", "status"
    )
    list_filter = ("status",)
