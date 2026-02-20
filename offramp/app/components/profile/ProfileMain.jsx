"use client";
import ProfileDashboardSection from "./ProfileDashboardSection";
import ProfileWeeklyPlanSection from "./ProfileWeeklyPlanSection";

export default function ProfileMain() {
  return (
    <div className="space-y-6">
      <ProfileDashboardSection />
      <ProfileWeeklyPlanSection />
    </div>
  );
}
