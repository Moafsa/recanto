"use client";
export default function LogoutButton() {
  return (
    <button
      onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }}
      className="rounded-full border border-white/20 px-4 py-2 text-cream/80 transition hover:bg-white/10"
    >Sair</button>
  );
}
