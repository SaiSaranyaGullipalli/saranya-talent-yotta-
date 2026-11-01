
from rest_framework import serializers
from django.db import transaction

from .models import (
    Candidate,
    Job,
    Application,
    Interview,
    Offer
)


APPLICATION_TRANSITIONS = {
    Application.Status.SUBMITTED: {
        Application.Status.SCREENING,
        Application.Status.REJECTED,
        Application.Status.WITHDRAWN,
    },
    Application.Status.SCREENING: {
        Application.Status.SHORTLISTED,
        Application.Status.REJECTED,
        Application.Status.WITHDRAWN,
    },
    Application.Status.SHORTLISTED: {
        Application.Status.INTERVIEW,
        Application.Status.REJECTED,
        Application.Status.WITHDRAWN,
    },
    Application.Status.INTERVIEW: {
        Application.Status.SELECTED,
        Application.Status.REJECTED,
        Application.Status.WITHDRAWN,
    },
    Application.Status.SELECTED: set(),
    Application.Status.REJECTED: set(),
    Application.Status.WITHDRAWN: set(),
}


class CandidateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Candidate
        fields = "__all__"


class JobSerializer(serializers.ModelSerializer):

    def validate(self, data):
        salary_min = data.get(
            "salary_min",
            getattr(self.instance, "salary_min", None)
        )

        salary_max = data.get(
            "salary_max",
            getattr(self.instance, "salary_max", None)
        )

        if (
            salary_min is not None
            and salary_max is not None
            and salary_min > salary_max
        ):
            raise serializers.ValidationError(
                "Minimum salary cannot exceed maximum salary."
            )

        return data

    class Meta:
        model = Job
        fields = "__all__"



class ApplicationSerializer(serializers.ModelSerializer):

    candidate_name = serializers.CharField(
        source="candidate.full_name",
        read_only=True
    )

    job_title = serializers.CharField(
        source="job.title",
        read_only=True
    )

    candidate_email = serializers.EmailField(
        source="candidate.email",
        read_only=True
    )

    class Meta:
        model = Application
        fields = "__all__"

        read_only_fields = [
            "id",
            "applied_at",
            "updated_at"
        ]

    def validate(self, data):

        candidate = data.get(
            "candidate",
            getattr(self.instance, "candidate", None)
        )

        job = data.get(
            "job",
            getattr(self.instance, "job", None)
        )

        if self.instance is None and job:
            if job.status != Job.Status.OPEN:
                raise serializers.ValidationError({
                    "job": "Applications can only be created for open jobs."
                })

        if self.instance is not None and "status" in data:
            current_status = self.instance.status
            next_status = data["status"]
            if (
                next_status != current_status
                and next_status not in APPLICATION_TRANSITIONS[current_status]
            ):
                raise serializers.ValidationError({
                    "status": f"Cannot move an application from {current_status} to {next_status}."
                })

        if candidate and job:

            existing = Application.objects.filter(
                candidate=candidate,
                job=job
            )

            if self.instance:
                existing = existing.exclude(
                    pk=self.instance.pk
                )

            if existing.exists():
                raise serializers.ValidationError({
                    "candidate": "This candidate has already applied for this job."
                })

        return data


class InterviewSerializer(serializers.ModelSerializer):

    class Meta:
        model = Interview
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

    def validate(self, data):
        application = data.get(
            "application",
            getattr(self.instance, "application", None)
        )
        if (
            self.instance is None
            and application
            and application.status != Application.Status.INTERVIEW
        ):
            raise serializers.ValidationError({
                "application": "Move the application to INTERVIEW before scheduling an interview."
            })
        return data

    def validate_status(self, value):
        if self.instance is None or value == self.instance.status:
            return value
        if self.instance.status == Interview.Status.SCHEDULED and value in (
            Interview.Status.COMPLETED,
            Interview.Status.CANCELLED,
        ):
            return value
        raise serializers.ValidationError(
            f"Cannot move an interview from {self.instance.status} to {value}."
        )

    def create(self, validated_data):
        with transaction.atomic():
            interview = super().create(validated_data)
            application = interview.application
            if application.status != Application.Status.SELECTED:
                application.status = Application.Status.INTERVIEW
                application.save(update_fields=["status", "updated_at"])
            return interview


class OfferSerializer(serializers.ModelSerializer):

    class Meta:
        model = Offer
        fields = "__all__"
        read_only_fields = ["id", "created_at"]

    def validate(self, data):
        application = data.get(
            "application",
            getattr(self.instance, "application", None)
        )
        if (
            self.instance is None
            and application
            and application.status != Application.Status.SELECTED
        ):
            raise serializers.ValidationError({
                "application": "Only selected candidates can receive an offer."
            })
        return data

    def validate_status(self, value):
        if self.instance is None or value == self.instance.status:
            return value
        allowed = {
            Offer.Status.DRAFT: {Offer.Status.SENT, Offer.Status.WITHDRAWN},
            Offer.Status.SENT: {
                Offer.Status.ACCEPTED,
                Offer.Status.DECLINED,
                Offer.Status.WITHDRAWN,
            },
            Offer.Status.ACCEPTED: set(),
            Offer.Status.DECLINED: set(),
            Offer.Status.WITHDRAWN: set(),
        }
        if value not in allowed[self.instance.status]:
            raise serializers.ValidationError(
                f"Cannot move an offer from {self.instance.status} to {value}."
            )
        return value
