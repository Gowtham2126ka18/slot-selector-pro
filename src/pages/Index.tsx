import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CalendarClock,
  Shield,
  Users,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  LayoutGrid,
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: CalendarClock,
      title: 'Smart Slot Selection',
      description:
        'Intuitive step-by-step wizard with real-time availability and dependency rules.',
    },
    {
      icon: Shield,
      title: 'Rule-Based Validation',
      description:
        'Automatic enforcement of scheduling constraints and capacity limits.',
    },
    {
      icon: Users,
      title: 'Fair Distribution',
      description:
        'Maximum 7 departments per slot ensures balanced resource allocation.',
    },
    {
      icon: LayoutGrid,
      title: 'Visual Grid View',
      description:
        'Clear overview of all slots with real-time capacity indicators.',
    },
  ];

  const stats = [
    { label: '2nd Year Departments', value: '20', icon: Building2 },
    { label: '3rd Year Departments', value: '18', icon: Building2 },
    { label: 'Slots Per Day', value: '3', icon: Clock },
    { label: 'Days Per Week', value: '6', icon: CalendarClock },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-gradient py-20 sm:py-28">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="animate-slide-up text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              Academic Department
              <span className="mt-2 block text-accent-foreground/90">
                Slot Allocation Portal
              </span>
            </h1>
            <p className="animate-slide-up mt-6 text-lg leading-relaxed text-primary-foreground/80 [animation-delay:100ms]">
              A secure, rule-based system for department heads to select academic
              time slots with real-time validation and fair distribution.
            </p>
            <div className="animate-slide-up mt-10 flex flex-wrap items-center justify-center gap-4 [animation-delay:200ms]">
              <Button
                asChild
                size="lg"
                className="gap-2 bg-accent text-accent-foreground shadow-elevated hover:bg-accent/90"
              >
                <Link to="/auth">
                  Login to Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/auth">Admin Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats Section */}
      <section className="border-b bg-card py-12">
        <div className="container">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-4 rounded-xl border bg-background p-4 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Designed for Academic Excellence
            </h2>
            <p className="mt-4 text-muted-foreground">
              Our platform ensures fair and efficient slot allocation with built-in
              validation rules.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="group border-border/50 bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-accent/10">
                    <Icon className="h-6 w-6 text-primary transition-colors group-hover:text-accent" />
                  </div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t bg-muted/30 py-16 sm:py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
            <p className="mt-4 text-muted-foreground">
              Simple 5-step process to secure your department's time slots.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-5">
            {[
              { step: 1, label: 'Select Department' },
              { step: 2, label: 'Choose Slot 1' },
              { step: 3, label: 'Choose Slot 2' },
              { step: 4, label: 'Choose Slot 3' },
              { step: 5, label: 'Confirm & Submit' },
            ].map(({ step, label }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {step}
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button asChild size="lg" className="gap-2">
              <Link to="/select-slot">
                Get Started Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2024 Academic Slot Portal. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              Secure & Rule-Based Allocation
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
