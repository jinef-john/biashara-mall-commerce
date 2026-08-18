import { SignUpButton } from '@clerk/nextjs';
import {
  CalendarClock,
  Globe,
  LayoutDashboard,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { PLATFORM_FEE_BPS } from '@biashara-mall/config';
import { Badge } from '@biashara-mall/ui/components/ui/badge';
import { Button } from '@biashara-mall/ui/components/ui/button';

const sellerKeepsPct = 100 - PLATFORM_FEE_BPS / 100;

const FEATURES = [
  {
    icon: Globe,
    title: 'Reach buyers everywhere',
    description:
      'Your shop appears across search, categories, and offers the moment you publish a product.',
  },
  {
    icon: Wallet,
    title: `Keep ${sellerKeepsPct}% of every sale`,
    description: `A flat ${PLATFORM_FEE_BPS / 100}% platform fee. No listing fees, no hidden costs.`,
  },
  {
    icon: LayoutDashboard,
    title: 'One dashboard for everything',
    description:
      'Products, events, discount codes, and stock: manage your whole shop in one place.',
  },
  {
    icon: CalendarClock,
    title: 'Run time-limited offers',
    description:
      'Schedule sales with a countdown, and hand out discount codes when you need a push.',
  },
];

const STEPS = [
  { title: 'Create your shop', description: 'Sign up and tell buyers what you sell.' },
  { title: 'List your products', description: 'Add products, set prices, and go live in minutes.' },
  { title: 'Start selling', description: 'Track stock and orders straight from your dashboard.' },
];

const CHART_BARS = [40, 65, 45, 80, 55, 90, 70];

function DashboardPreview() {
  return (
    <div className="relative mt-16 w-full max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low shadow-lg">
        <div className="flex items-center gap-2 border-b border-outline-variant bg-surface-container-lowest px-4 py-3">
          <span className="size-2.5 rounded-full bg-tertiary" />
          <span className="size-2.5 rounded-full bg-secondary" />
          <span className="size-2.5 rounded-full bg-primary" />
          <span className="ml-2 text-label-sm text-on-surface-variant">
            Your dashboard
          </span>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-3">
          <div className="rounded-lg bg-surface-container-lowest p-4 shadow-sm">
            <span className="text-label-sm text-on-surface-variant">
              This month
            </span>
            <p className="mt-1 text-headline-sm text-on-surface">$4,280</p>
          </div>
          <div className="rounded-lg bg-surface-container-lowest p-4 shadow-sm">
            <span className="text-label-sm text-on-surface-variant">
              Orders
            </span>
            <p className="mt-1 text-headline-sm text-on-surface">128</p>
          </div>
          <div className="rounded-lg bg-surface-container-lowest p-4 shadow-sm">
            <span className="text-label-sm text-on-surface-variant">
              You keep
            </span>
            <p className="mt-1 text-headline-sm text-on-surface">
              {sellerKeepsPct}%
            </p>
          </div>
        </div>

        <div className="flex items-end gap-2 px-6 pb-6" aria-hidden>
          {CHART_BARS.map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-primary/70"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      </div>

      <div className="absolute -top-4 -right-4 hidden items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 shadow-lg ring-1 ring-outline-variant sm:flex">
        <TrendingUp className="size-4 text-secondary" />
        <span className="text-label-sm font-medium text-on-surface">
          +24% this week
        </span>
      </div>
    </div>
  );
}

export function SellerLanding() {
  return (
    <main className="flex flex-col bg-surface">
      <section
        className="relative flex w-full flex-col items-center overflow-hidden border-b border-outline-variant px-4 pt-16 pb-12 text-center sm:pt-24 sm:pb-16"
        style={{
          backgroundImage:
            'radial-gradient(var(--color-outline-variant) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
          <Badge className="bg-primary-container text-on-primary-container">
            Seller Portal
          </Badge>
          <h1 className="text-headline-xl text-on-surface">
            Sell to thousands of buyers.
            <br />
            <span className="text-primary">
              Keep {sellerKeepsPct}% of every sale.
            </span>
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Set up your shop in minutes, list your products, and start
            selling on Biashara Mall's growing marketplace.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <SignUpButton mode="modal">
              <Button size="lg">Start selling, it's free</Button>
            </SignUpButton>
            <Button asChild variant="outline" size="lg">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
        </div>

        <DashboardPreview />
      </section>

      <section className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 px-4 py-16 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-1 flex size-12 items-center justify-center rounded-lg bg-surface-container text-primary">
              <feature.icon className="size-6" />
            </div>
            <h3 className="text-body-lg font-medium text-on-surface">
              {feature.title}
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              {feature.description}
            </p>
          </div>
        ))}
      </section>

      <section
        id="how-it-works"
        className="w-full border-t border-b border-outline-variant bg-surface-container-low px-4 py-16"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-headline-lg text-on-surface">
              How it works
            </h2>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Get up and running in three simple steps.
            </p>
          </div>

          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row">
            <div className="absolute top-6 right-12 left-12 hidden h-0.5 bg-outline-variant md:block" />
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="z-10 flex w-full flex-col items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 text-center shadow-sm md:w-1/3"
              >
                <div className="mb-1 flex size-12 items-center justify-center rounded-full border-4 border-surface-container-lowest bg-primary-container text-headline-sm text-on-primary-container shadow">
                  {i + 1}
                </div>
                <h3 className="text-body-lg font-medium text-on-surface">
                  {step.title}
                </h3>
                <p className="text-body-sm text-on-surface-variant">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <SignUpButton mode="modal">
              <Button size="lg">Create your shop</Button>
            </SignUpButton>
          </div>
        </div>
      </section>

      <footer className="flex w-full items-center justify-center px-4 py-6">
        <span className="text-label-sm text-on-surface-variant">
          © {new Date().getFullYear()} Biashara Mall
        </span>
      </footer>
    </main>
  );
}
