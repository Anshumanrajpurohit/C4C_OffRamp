import { Suspense } from "react";
import ProfileSetupContent from "./ProfileSetupContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileSetupContent />
    </Suspense>
  );
}
