"use client";

import { useRouter } from "next/navigation";

type Tab = "home" | "log" | "profile";

export default function BottomNav({ active }: { active: Tab }) {
  const router = useRouter();

  const tabs: { id: Tab; label: string; href: string; icon: string }[] = [
    { id: "home",    label: "Today",   href: "/",        icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "log",     label: "Log",     href: "/log",     icon: "M12 4v16m8-8H4" },
    { id: "profile", label: "Profile", href: "/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-[#E7E2D6] flex justify-around items-center h-16 z-50">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.href)}
            className={`flex flex-col items-center gap-1 flex-1 py-2 transition-colors ${
              isActive ? "text-[#2F5233]" : "text-[#9A9484] hover:text-[#5B6B5D]"
            }`}
            aria-label={tab.label}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={isActive ? 2.5 : 1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            <span className={`text-[10px] font-medium ${isActive ? "text-[#2F5233]" : "text-[#9A9484]"}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
