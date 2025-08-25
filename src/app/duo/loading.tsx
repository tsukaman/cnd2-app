import { SkeletonProfile } from "@/components/ui/Skeleton";
import BackgroundEffects from "@/components/effects/BackgroundEffects";

export default function Loading() {
  return (
    <>
      <BackgroundEffects />
      <div className="min-h-screen p-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="animate-pulse">
              <div className="h-12 w-48 bg-white/10 rounded-lg mx-auto mb-4" />
              <div className="h-6 w-64 bg-white/10 rounded-lg mx-auto" />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <SkeletonProfile />
            <SkeletonProfile />
          </div>
          
          <div className="text-center">
            <div className="h-14 w-48 bg-white/10 rounded-xl mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    </>
  );
}