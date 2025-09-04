
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, ClipboardCheck, ShieldCheck, UserCheck, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPlatformLogo } from '@/lib/actions/settings-actions';

const features = [
  {
    icon: <ClipboardCheck className="h-10 w-10 text-primary" />,
    title: 'Streamlined Assessments',
    description: 'Digitize and automate PHQ-9 and GAD-7 questionnaires, making them easy for patients to complete and for doctors to track.',
  },
  {
    icon: <Bot className="h-10 w-10 text-primary" />,
    title: 'AI-Powered Insights',
    description: 'Receive AI-generated resource recommendations based on assessment results to provide immediate, helpful guidance.',
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: 'Secure & HIPAA-Compliant',
    description: 'Built with security at its core, our platform ensures patient data is protected and communication is confidential.',
  },
];

const howItWorksPatient = [
  {
    icon: <UserCheck className="h-8 w-8 text-primary" />,
    step: 1,
    title: 'Complete Your Assessment',
    description: 'Fill out the PHQ-9 and GAD-7 forms sent by your doctor from the comfort of your home.',
  },
  {
    icon: <ClipboardCheck className="h-8 w-8 text-primary" />,
    step: 2,
    title: 'Get Instant Resources',
    description: 'Receive a list of AI-curated mental health resources tailored to your responses immediately after submission.',
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    step: 3,
    title: 'Securely Share with Your Doctor',
    description: 'Your results are automatically and securely shared with your linked physician for review and follow-up.',
  },
];

const howItWorksDoctor = [
  {
    icon: <UserCheck className="h-8 w-8 text-primary" />,
    step: 1,
    title: 'Add Your Patients',
    description: 'Easily add your patients to the platform and send them a secure link to complete their first assessment.',
  },
  {
    icon: <ClipboardCheck className="h-8 w-8 text-primary" />,
    step: 2,
    title: 'Review Completed Assessments',
    description: 'Get notified when a patient completes an assessment. Review scores, trends, and patient-provided context all in one place.',
  },
  {
    icon: <Stethoscope className="h-8 w-8 text-primary" />,
    step: 3,
    title: 'Provide Better Care',
    description: 'Use data-driven insights to inform your consultations and provide more timely and effective mental healthcare.',
  },
];


export function LandingPageClient() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogo() {
      const url = await getPlatformLogo();
      setLogoUrl(url);
    }
    fetchLogo();
  }, []);

  const finalLogoUrl = logoUrl || "https://ourwellnesslife.com/wp-content/uploads/2023/06/owl-logo-w.png";
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Empowering Mental Wellness Through Smart Assessments
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    A seamless, secure platform for PHQ-9 and GAD-7 assessments, connecting patients and doctors for better mental health outcomes.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/sign-up">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/login">Login</Link>
                  </Button>
                </div>
              </div>
              <Image
                  alt="Hero"
                  className="mx-auto aspect-square overflow-hidden rounded-xl object-contain sm:w-full lg:order-last"
                  data-ai-hint="wellness logo"
                  height="550"
                  src={finalLogoUrl}
                  width="550"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary">
          <div className="container px-4 md:px_6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Why Choose Our Wellness Life?</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is designed to be simple for patients and powerful for doctors.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-12 py-12 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="grid gap-4 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-background">
                    {feature.icon}
                  </div>
                  <div className="grid gap-1">
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px_6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">A Simple Process for Everyone</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Whether you&apos;re a patient or a provider, getting started is straightforward.
                </p>
              </div>
            </div>
            <div className="grid gap-16 lg:grid-cols-2">
              <div>
                <h3 className="text-2xl font-bold mb-6 text-center">For Patients</h3>
                <div className="space-y-8">
                  {howItWorksPatient.map((item) => (
                    <div key={item.step} className="flex items-start gap-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">{item.step}</div>
                      <div>
                        <h4 className="text-lg font-semibold">{item.title}</h4>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-6 text-center">For Doctors</h3>
                <div className="space-y-8">
                  {howItWorksDoctor.map((item) => (
                    <div key={item.step} className="flex items-start gap-6">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">{item.step}</div>
                      <div>
                        <h4 className="text-lg font-semibold">{item.title}</h4>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 border-t bg-secondary">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px_6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Take the First Step Towards Better Mental Health Management
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join today and experience a smarter, more connected way to handle mental health assessments.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Get Started Now
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px_6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2025 OUR WELLNESS LIFE, INC. All rights reserved.</p>
      </footer>
    </div>
  );
}
