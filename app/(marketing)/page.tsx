import { NavHeader } from "@/components/shared/nav-header";

export default function MarketingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <NavHeader />
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Kona Agency</h1>
        <p className="mt-4 text-base text-slate-600">The marketing site shell is ready for the Kona platform.</p>
      </div>
    </main>
  );
}
