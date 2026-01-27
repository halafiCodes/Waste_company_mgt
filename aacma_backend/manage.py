#!/usr/bin/env python
import os
import sys

# Ensure standard library modules like 'collections' take precedence over
# any same-named local packages by moving the project directory to the end
# of sys.path before importing Django.
project_dir = os.path.dirname(os.path.abspath(__file__))
if sys.path and os.path.abspath(sys.path[0]) == project_dir:
    sys.path.append(sys.path.pop(0))


def main() -> None:
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "aacma.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()

