from studyFlax.models.tasks.taskModel import Task 

DEFAULT_PAGE_TIME = 2.0 

def get_avg_time_per_page(user):
    completed = Task.objects.filter(
        user=user,
        completed=True,
        reading__isnull=False, 
        time_spent__gt=0,
    ).select_related('reading')

    total_pages = sum(task.reading_page.count() for task in completed)
    total_minutes = sum(task.time_spent for task in completed)
    if total_pages == 0:
        return DEFAULT_PAGE_TIME
    return total_minutes / total_pages

def estimated_time_reading(reading, user):
    if reading.estimated_minutes is not None:
        return reading.estimated_minutes
    avg = get_avg_time_per_page(user)
    return round(reading.page_count() * avg)

