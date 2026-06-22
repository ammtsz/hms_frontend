"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/attendance", label: "Attendances" },
  { href: "/agenda", label: "Schedule" },
  { href: "/patients", label: "Patients" },
];

export default function TabNav() {
  const { user } = useAuthContext();
  const pathname = usePathname();

  if (!user) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-20 w-full shrink-0 bg-[color:var(--surface)] px-2 py-2 sm:py-3">
      <div className="relative flex w-full snap-x snap-mandatory overflow-x-auto bg-gray-50">
        <div className="absolute bottom-0 left-0 right-0 z-0 h-px bg-[#e2e8f0]" />
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`tab-button${
                isActive ? " active" : ""
              } min-h-[44px] min-w-0 flex-1 snap-start text-center sm:min-w-[120px]`}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
