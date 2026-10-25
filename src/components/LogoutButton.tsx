"use client";

export function LogoutButton({ className = "text-sm text-gray-600 hover:text-gray-900" }: { className?: string }) {
  return (
    <button
      className={className}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      Logout
    </button>
  );
}
