"use client";

export function LogoutButton() {
  return (
    <button
      className="text-sm text-gray-600 hover:text-gray-900"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      Logout
    </button>
  );
}
