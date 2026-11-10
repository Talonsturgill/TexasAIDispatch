"""Dependency-free operation names shared by capture admission and image review."""

PHONE_OPERATIONS = {key: 'exact-phone-' + key + ' motion-image review extraction' for key in ('a', 'b', 'current')}
