"use client";

import { useLanguage } from "@/app/components/useLanguage";

export default function LoadingEvent() {
  const { strings } = useLanguage();

  return (
    <div className="min-h-screen bg-cute text-cute-ink flex items-center justify-center px-5">
      <div className="card-cute w-full max-w-md flex flex-col items-center justify-center py-10">
        <img
          className="mona-day cute-float"
          src="https://github.githubassets.com/images/mona-loading-default.gif"
          alt="Loading"
          width={170}
          height={170}
        />
        <img
          className="mona-night cute-float"
          src="https://github.githubassets.com/images/mona-loading-dark.gif"
          alt="Loading"
          width={170}
          height={170}
        />

        <p className="mt-4 text-sm font-semibold text-cute-muted">
          {strings.messages.wakingPlans} <span className="font-extrabold">zZz</span>
        </p>
      </div>
    </div>
  );
}
