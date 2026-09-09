from django.core.management.base import BaseCommand
from hostels.models import expired_grace_hostels, HOSTEL_GRACE_DAYS


class Command(BaseCommand):
    help = (
        f"Remove caretaker hostels whose {HOSTEL_GRACE_DAYS}-day subscription "
        "grace period has lapsed unpaid. Run this periodically (e.g. once a "
        "day) so unpaid hostels do not stay on the site."
    )

    def handle(self, *args, **options):
        candidates = expired_grace_hostels()
        count = candidates.count()

        hostel_ids = list(candidates.values_list('id', flat=True))
        if hostel_ids:
            # Remove the linked subscriptions first, then the hostels.
            from hostels.models import HostelSubscription
            HostelSubscription.objects.filter(hostel_id__in=hostel_ids).delete()
            candidates.delete()

        if count:
            self.stdout.write(self.style.SUCCESS(
                f"Removed {count} hostel(s) whose {HOSTEL_GRACE_DAYS}-day grace period lapsed unpaid."
            ))
        else:
            self.stdout.write("No hostels have lapsed their grace period.")
