"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, MapPin, BarChart3, Bell, Shield, Users, Recycle, Clock, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

interface LandingPageProps {
  onOpenLogin: () => void
  onOpenSignup: () => void
}

export function LandingPage({ onOpenLogin, onOpenSignup }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Recycle className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">AACMA</span>
              <span className="text-xs text-muted-foreground">Waste Management</span>
            </div>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Services
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onOpenLogin}>
              Sign In
            </Button>
            <Button onClick={onOpenSignup}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">Serving Addis Ababa since 2024</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
              Transforming Urban Waste Management for a{" "}
              <span className="text-primary">Cleaner City</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground text-pretty">
              An integrated digital platform connecting residents, waste companies, and city authorities 
              for efficient, transparent, and sustainable waste collection and recycling operations.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" onClick={onOpenSignup} className="gap-2">
                Register Now
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={onOpenLogin}>
                Sign In to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { label: "Registered Residents", value: "150K+" },
              { label: "Collection Trucks", value: "320" },
              { label: "Daily Pickups", value: "12K+" },
              { label: "Recycling Rate", value: "45%" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Comprehensive Waste Management Solutions
            </h2>
            <p className="text-lg text-muted-foreground">
              Our platform offers a complete suite of tools for every stakeholder in the waste management ecosystem.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Real-Time GPS Tracking",
                description: "Track collection trucks in real-time with integrated Google Maps visualization for complete route transparency.",
              },
              {
                icon: Clock,
                title: "Smart Scheduling",
                description: "Automated scheduling and route optimization ensures timely waste collection across all service zones.",
              },
              {
                icon: Bell,
                title: "Instant Notifications",
                description: "Stay informed with push notifications for pickup reminders, status updates, and service alerts.",
              },
              {
                icon: BarChart3,
                title: "Performance Analytics",
                description: "Generate comprehensive reports on collection efficiency, recycling rates, and operational metrics.",
              },
              {
                icon: Users,
                title: "Multi-Role Access",
                description: "Dedicated dashboards for residents, waste companies, and central authority with role-based permissions.",
              },
              {
                icon: Shield,
                title: "Secure Platform",
                description: "Enterprise-grade security with encrypted communications and secure authentication protocols.",
              },
            ].map((feature) => (
              <Card key={feature.title} className="group hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-y bg-muted/50 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Simple steps to get started with our waste management platform.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { step: "1", title: "Register", description: "Create your account as a resident, company, or authority." },
              { step: "2", title: "Request Service", description: "Submit waste collection requests with type and schedule." },
              { step: "3", title: "Track Progress", description: "Monitor your pickup status in real-time on the map." },
              { step: "4", title: "Get Notified", description: "Receive updates when your waste is collected." },
            ].map((item, index) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                {index < 3 && (
                  <div className="absolute left-[calc(50%+40px)] top-8 hidden w-[calc(100%-80px)] border-t-2 border-dashed border-border md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Services for Every User
            </h2>
            <p className="text-lg text-muted-foreground">
              Tailored experiences for all stakeholders in the waste management ecosystem.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="relative overflow-hidden border-2 hover:border-primary transition-colors">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10" />
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">For Residents</CardTitle>
                <CardDescription className="text-base">
                  Easy waste collection requests and tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Request waste collection online",
                  "Track pickup status in real-time",
                  "Submit complaints and reports",
                  "View collection history",
                  "Receive pickup notifications",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-primary transition-colors">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10" />
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Truck className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">For Waste Companies</CardTitle>
                <CardDescription className="text-base">
                  Complete fleet and operations management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Manage vehicle fleet",
                  "Assign drivers to routes",
                  "Track collections in real-time",
                  "Generate performance reports",
                  "Handle service requests",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-primary transition-colors">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/10" />
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">For Central Authority</CardTitle>
                <CardDescription className="text-base">
                  City-wide oversight and management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Approve waste companies",
                  "Assign service zones",
                  "Monitor city-wide operations",
                  "Generate analytics reports",
                  "Manage complaints escalation",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80">
            Join thousands of residents and businesses using our platform for cleaner neighborhoods.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" onClick={onOpenSignup} className="gap-2">
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onOpenLogin} className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground bg-transparent">
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Recycle className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">AACMA</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Addis Ababa Cleansing Management Agency - Building a cleaner, sustainable city for all.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-foreground">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
                <li><Link href="#services" className="hover:text-foreground transition-colors">Services</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-foreground">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">FAQs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-foreground">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Addis Ababa, Ethiopia</li>
                <li>info@aacma.gov.et</li>
                <li>+251 11 123 4567</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Addis Ababa Cleansing Management Agency. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
