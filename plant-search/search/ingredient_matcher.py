from __future__ import annotations

from difflib import SequenceMatcher
from typing import List, Tuple


def _similar(a: str, b: str) -> bool:
    if not a or not b:
        return False
    if a == b:
        return True
    return SequenceMatcher(None, a, b).ratio() >= 0.86


def ingredient_similarity(source: List[str], candidate: List[str]) -> Tuple[float, List[str]]:
    if not source or not candidate:
        return 0.0, []

    candidate_pool = list({item for item in candidate if item})
    matched: List[str] = []

    for src in source:
        for cand in candidate_pool:
            if _similar(src, cand):
                matched.append(cand if cand == src else f"{src}~{cand}")
                break

    source_unique = len({item for item in source if item})
    candidate_unique = len({item for item in candidate if item})
    union_size = source_unique + candidate_unique - len(matched)
    if union_size <= 0:
        return 0.0, []

    score = len(matched) / union_size
    clean_matched = sorted({m.split("~", 1)[0] for m in matched})
    return score, clean_matched[:8]
