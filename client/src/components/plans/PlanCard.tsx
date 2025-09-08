import React from "react";
import type { Plan } from "../../types";


const VITE_API_BASE = import.meta.env.VITE_API_BASE as string;

type Props = {
  plan: Plan;
  className?: string;
  children?: React.ReactNode;
  placeholderSrc?: string;
};

export default function PlanCard({
  plan,
  className = "",
  children,
  placeholderSrc = "/placeholder-image.png",
}: Props) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm flex flex-col ${className}`}
    >
      <div className="flex-shrink-0 h-40 w-full rounded-lg overflow-hidden bg-gray-100 mb-4 flex items-center justify-center">
        <img
          src={`${VITE_API_BASE}/plans/${plan.id}/image`}
          alt={plan.name}
          onError={(e) => ((e.target as HTMLImageElement).src = placeholderSrc)}
          className="object-cover w-full h-full"
        />
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold line-clamp-2">{plan.name}</h3>
        {plan.description ? (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {plan.description}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-400">Price</div>
          <div className="font-medium">${Number(plan.price).toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Duration</div>
          <div className="font-medium">{plan.duration} days</div>
        </div>
      </div>

      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
