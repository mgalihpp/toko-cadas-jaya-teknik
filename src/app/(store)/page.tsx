import { Suspense } from "react";
import { HomePage, HomeSkeleton } from "@/features/home";

export default function Page() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomePage />
    </Suspense>
  );
}
