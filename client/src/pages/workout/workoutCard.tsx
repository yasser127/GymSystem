import React from "react";

export type Workout = {
  id: string;
  name: string;
  muscle: string;
  videoId: string; 
};

type Props = {
  workout: Workout;
  onSelect: (videoId: string, name: string) => void;
};

export default function WorkoutCard({ workout, onSelect }: Props) {
  const thumbnail = `https://img.youtube.com/vi/${workout.videoId}/hqdefault.jpg`;

  return (
    <button
      onClick={() => onSelect(workout.videoId, workout.name)}
      className="group bg-white rounded-2xl shadow-md overflow-hidden transform transition-transform duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label={`Open ${workout.name} video`}
    >
      <div className="relative w-full h-40 sm:h-44 md:h-36 lg:h-44">
        <img
          src={thumbnail}
          alt={`${workout.name} thumbnail`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">{workout.muscle}</div>
      </div>

      <div className="p-4 text-left">
        <h3 className="text-sm sm:text-base font-semibold text-gray-800">{workout.name}</h3>
        <p className="text-xs text-gray-500 mt-1">Tap to watch</p>
      </div>
    </button>
  );
}


