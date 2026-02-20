// Transition Service — core business logic for weekly meal-swap planning

export type WeekPlan = {
  week_number: number;
  meals_to_replace: number;
};

/**
 * Spread baseline meals evenly across totalWeeks,
 * increasing the target count each week.
 */
export function calculateWeeklyTransition(
  baselineMeals: number,
  totalWeeks: number
): WeekPlan[] {
  const weeklyIncrease = baselineMeals / totalWeeks;
  const plan: WeekPlan[] = [];

  for (let week = 1; week <= totalWeeks; week++) {
    const mealsToReplace = Math.min(
      Math.ceil(weeklyIncrease * week),
      baselineMeals
    );
    plan.push({ week_number: week, meals_to_replace: mealsToReplace });
  }

  return plan;
}

const DAYS_OF_WEEK = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

/**
 * Return the first N days of the week as swap days.
 */
export function generateSwapDays(mealsToReplace: number): DayOfWeek[] {
  const count = Math.min(mealsToReplace, DAYS_OF_WEEK.length);
  return DAYS_OF_WEEK.slice(0, count);
}

/** Returns today's lowercase day name, e.g. "monday" */
export function getTodayDayName(): DayOfWeek {
  return DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
}
