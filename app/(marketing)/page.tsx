import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton
} from "@clerk/nextjs";
import {
  MessageSquare,
  ArrowRight,
  Settings,
  Users,
  Database,
  CreditCard,
  CheckCircle2,
  Sparkles
} from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Kona</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">How it works</Link>
            <Link href="#agents" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Agents</Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
            <Link href="#docs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Documentation</Link>
          </div>

          <div className="flex items-center gap-4">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="rounded-full px-6">Get Started</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-20">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-full -translate-x-1/2 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-10 blur-[120px]" />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="mx-auto mb-8 flex max-w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">The first AI-Agency platform</span>
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
            Meet <span className="bg-gradient-to-b from-primary to-primary/50 bg-clip-text text-transparent italic">Kona</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Deploy specialized AI agents that work together to solve complex business problems.
            Automate your workflow with the world's most advanced agency platform.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <SignUpButton mode="modal">
              <Button size="lg" className="h-12 rounded-full px-8 text-base">
                Start Building <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </SignUpButton>
            <Button size="lg" variant="outline" className="h-12 rounded-full border-white/10 bg-white/5 px-8 text-base backdrop-blur-sm">
              View Demo
            </Button>
          </div>

          {/* Hero Image/Card Placeholder */}
          <div className="mt-20 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="aspect-[16/9] w-full rounded-xl bg-zinc-900/50" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Three steps to automate your business with Kona.</p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Define your goals",
                desc: "Tell Kona what you want to achieve. Our platform helps you map out the necessary agents and workflows.",
                icon: Settings
              },
              {
                step: "02",
                title: "Select your agents",
                desc: "Choose from our library of specialized AI agents or create your own custom agents for specific tasks.",
                icon: Users
              },
              {
                step: "03",
                title: "Scale your agency",
                desc: "Let your agents work together in a secure environment. Monitor progress and scale as needed.",
                icon: Database
              }
            ].map((item, i) => (
              <div key={i} className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-colors hover:bg-white/[0.05]">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Step {item.step}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents Grid */}
      <section id="agents" className="py-24 sm:py-32 bg-white/[0.02]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Specialized Agents</h2>
              <p className="mt-4 text-lg text-muted-foreground">Powerful AI agents ready to join your team.</p>
            </div>
            <Button variant="outline" className="rounded-full">View all agents</Button>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Content Agent", role: "Copywriting & Strategy", icon: MessageSquare },
              { name: "Data Analyst", role: "Insights & Reporting", icon: Database },
              { name: "DevOps Agent", role: "Deployment & Scaling", icon: Settings },
              { name: "Customer Success", role: "Support & Retention", icon: Users },
            ].map((agent, i) => (
              <div key={i} className="group flex flex-col items-center rounded-2xl border border-white/5 bg-background p-6 text-center transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-primary transition-colors group-hover:bg-primary/10">
                  <agent.icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold">{agent.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{agent.role}</p>
                <Button variant="ghost" size="sm" className="mt-6 w-full rounded-xl group-hover:bg-primary group-hover:text-primary-foreground">
                  View details
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">Choose the plan that's right for your agency.</p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$49",
                desc: "Perfect for individuals and small projects.",
                features: ["Up to 3 active agents", "Basic workflow automation", "Standard support", "Community access"]
              },
              {
                name: "Pro",
                price: "$199",
                desc: "For growing agencies that need more power.",
                features: ["Unlimited active agents", "Advanced multi-agent orchestration", "Priority support", "Custom agent development", "API Access"],
                popular: true
              }
            ].map((plan, i) => (
              <div key={i} className={cn(
                "relative flex flex-col rounded-3xl border p-8 transition-all hover:border-primary/50",
                plan.popular ? "border-primary bg-primary/5 shadow-[0_0_40px_rgba(var(--primary),0.1)]" : "border-white/10 bg-white/[0.02]"
              )}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="mt-4 text-muted-foreground">{plan.desc}</p>
                </div>
                <ul className="mb-8 flex-1 space-y-4">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <SignUpButton mode="modal">
                  <Button variant={plan.popular ? "default" : "outline"} className={cn("w-full rounded-xl h-12 text-base", !plan.popular && "border-white/10 bg-white/5")}>
                    Get Started
                  </Button>
                </SignUpButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold tracking-tight">Kona</span>
              </div>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                The world's first specialized AI agent platform for businesses and agencies.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider">Product</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Agents</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider">Company</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider">Support</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-white/5 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Kona Agency. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
