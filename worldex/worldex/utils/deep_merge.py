from toolz.dicttoolz import merge_with


def deep_merge(target, *source):
    """deep merge dictionary. if there is overlap in values, source is prioritized"""

    def combine(vals):
        if len(vals) == 1 or not all(isinstance(v, dict) for v in vals):
            return vals[-1]
        else:
            return deep_merge(*vals)

    return merge_with(combine, target, *source)
