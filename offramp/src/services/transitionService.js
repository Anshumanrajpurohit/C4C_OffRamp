// ---------------------------------------------------------------------------
// transitionService.js
// Core logic: generate a weekly meal-swap plan and derive swap days.
// ---------------------------------------------------------------------------

/**
 * Spread baseline non-veg meals evenly across the transition period.
 * Returns an array of { week_number, meals_to_replace }.
 *
 * @param {number} baselineMeals   – current non-veg meals per week
 * @param {number} totalWeeks      – total transition period in weeks
 * @returns {{ week_number: number, meals_to_replace: number }[]}
 */
export function calculateWeeklyTransition(baselineMeals, totalWeeks) {
  const weeklyIncrease = baselineMeals / totalWeeks;
  const plan = [];

  for (let week = 1; week <= totalWeeks; week++) {
    const mealsToReplace = Math.min(
      Math.ceil(weeklyIncrease * week),
      baselineMeals
    );
    plan.push({ week_number: week, meals_to_replace: mealsToReplace });
  }

  return plan;
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/**
 * Return the first N days of the week as swap days.
 *
 * @param {number} mealsToReplace
 * @returns {string[]}
 */
export function generateSwapDays(mealsToReplace) {
  return DAYS.slice(0, Math.min(mealsToReplace, DAYS.length));
}

/**
 * Returns today's lowercase day name, e.g. "monday".
 * @returns {string}
 */
export function getTodayDayName() {
  // getDay() returns 0=Sun … 6=Sat; remap to Mon=0 … Sun=6
  const idx = new Date().getDay();
  return DAYS[idx === 0 ? 6 : idx - 1];
}
