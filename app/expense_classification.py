from dataclasses import dataclass
import re


@dataclass(frozen=True)
class Classification:
    really_needed: bool
    reason: str


# These rules are intentionally conservative: ambiguous purchases default to non-essential.
NEEDED_KEYWORDS = (
    "rent",
    "mortgage",
    "electricity",
    "water bill",
    "gas bill",
    "internet",
    "phone bill",
    "groceries",
    "grocery",
    "food",
    "medicine",
    "medication",
    "prescription",
    "doctor",
    "hospital",
    "medical",
    "lab test",
    "lab tests",
    "transport",
    "transportation",
    "bus",
    "train",
    "fuel",
    "petrol",
    "school",
    "education",
    "insurance",
)

NON_NEEDED_KEYWORDS = (
    "video game",
    "game",
    "gaming",
    "cinema",
    "movie",
    "concert",
    "entertainment",
    "vacation",
    "holiday",
    "party",
    "hobby",
    "luxury",
    "designer",
    "jewelry",
    "jewellery",
    "alcohol",
    "restaurant",
    "takeaway",
    "takeout",
)


def _normalise(value: str) -> str:
    return re.sub(r"\s+", " ", value.casefold()).strip()


def classify_expense(name: str) -> Classification:
    """Apply deterministic essential-expense guardrails to a purchase name."""
    normalised_name = _normalise(name)

    if any(keyword in normalised_name for keyword in NON_NEEDED_KEYWORDS):
        return Classification(
            really_needed=False,
            reason="This matches a discretionary category such as entertainment, gaming, leisure, or luxury.",
        )

    if any(keyword in normalised_name for keyword in NEEDED_KEYWORDS):
        return Classification(
            really_needed=True,
            reason="This matches an essential category such as housing, utilities, food, medical care, education, or transport.",
        )

    return Classification(
        really_needed=False,
        reason="This purchase did not match a known essential category, so it defaults to not really needed.",
    )
