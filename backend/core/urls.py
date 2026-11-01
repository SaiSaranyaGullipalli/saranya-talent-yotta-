from django.urls import path, include

from rest_framework.routers import DefaultRouter

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)

from .views import (
    health_check,
    parse_resume,
    candidate_job_matches,
    current_user,
    logout_user,
    CandidateViewSet,
    JobViewSet,
    ApplicationViewSet,
    InterviewViewSet,
    OfferViewSet
)

router = DefaultRouter()

router.register(
    "candidates",
    CandidateViewSet,
    basename="candidate"
)

router.register(
    "jobs",
    JobViewSet,
    basename="job"
)

router.register(
    "applications",
    ApplicationViewSet,
    basename="application"
)

router.register(
    "interviews",
    InterviewViewSet,
    basename="interview"
)

router.register(
    "offers",
    OfferViewSet,
    basename="offer"
)


urlpatterns = [
    path("health/", health_check, name="health_check"),

    path("ai/resume-parse/", parse_resume, name="resume_parse"),
    path("ai/job-matches/", candidate_job_matches, name="candidate_job_matches"),

    path("auth/login/", TokenObtainPairView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("auth/me/", current_user),
    path("auth/logout/", logout_user),

    path("", include(router.urls)),
]
