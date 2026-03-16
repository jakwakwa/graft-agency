import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Typography.H1>Hello, Welcome to Kona Agency</Typography.H1>
        <Typography.P className="text-lg text-muted-foreground">This is a test</Typography.P>
        <Button variant="default">Click me</Button>
      </main>
    </div>
  );
}
