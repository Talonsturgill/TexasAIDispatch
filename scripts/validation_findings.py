"""Read retained validator findings without rewriting independent review evidence."""


def valid_finding(item):
    """Support legacy prose and the validator's structured claim rejection shape."""
    if isinstance(item, str):
        return bool(item.strip())
    return (isinstance(item, dict) and set(item) == {"id", "reason"}
            and all(isinstance(item[key], str) and item[key].strip()
                    for key in ("id", "reason")))


def valid_findings(value, *, allow_empty=False):
    return (isinstance(value, list) and (bool(value) or allow_empty)
            and all(valid_finding(item) for item in value))
