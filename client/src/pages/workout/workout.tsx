import { useEffect, useState } from "react";
import WorkoutCard from "./workoutCard";
import type { Workout } from "./workoutCard";

const SAMPLE_WORKOUTS: Workout[] = [
  {
    id: "1",
    name: "Abs Burnout — 10 min",
    muscle: "Abs",
    videoId: "pSHjTRCQxIw",
  },
  {
    id: "2",
    name: "Back Strength Routine",
    muscle: "Back",
    videoId: "WO1a3pWJiz0",
  },
  {
    id: "3",
    name: "Shoulders Sculpt",
    muscle: "Shoulders",
    videoId: "ufrFCjERMDc",
  },
  {
    id: "4",
    name: "Full Body Quick",
    muscle: "Full Body",
    videoId: "UBMk30rjy0o",
  },
  {
    id: "5",
    name: "Legs & Glutes Blast",
    muscle: "Legs",
    videoId: "2L2lnxIcNmo",
  },
  {
    id: "6",
    name: "Chest",
    muscle: "Legs",
    videoId: "_q_-adYzkh0",
  },
];

export default function Workout() {
  const [workouts] = useState<Workout[]>(SAMPLE_WORKOUTS);
  const [playing, setPlaying] = useState<null | {
    videoId: string;
    title: string;
  }>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPlaying(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Workouts</h2>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 ">
        {workouts.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            onSelect={(videoId, title) => setPlaying({ videoId, title })}
          />
        ))}
      </div>

      {/* Modal player */}
      {playing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Video player — ${playing.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setPlaying(null)}
            aria-hidden
          />

          <div className="relative w-full max-w-3xl mx-auto">
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="text-sm font-medium">{playing.title}</h3>
                <button
                  onClick={() => setPlaying(null)}
                  className="text-gray-600 hover:text-gray-900 px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Close video"
                >
                  Close
                </button>
              </div>

              <div className="bg-black">
                <div
                  className="w-full"
                  style={{ height: "60vh", maxHeight: "80vh" }}
                >
                  <iframe
                    title={playing.title}
                    src={`https://www.youtube.com/embed/${playing.videoId}?autoplay=1&rel=0`}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
