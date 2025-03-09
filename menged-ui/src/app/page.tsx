"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Bus, Calendar, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// Animated section component
function AnimatedSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeIn}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section with Map Animation */}
      <section className="relative h-[90vh] flex items-center overflow-hidden">
        {/* Map Background with Parallax Effect */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop"
            alt="Addis Ababa Map View"
            fill
            style={{ objectFit: "cover" }}
            quality={90}
            priority
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Animated Content */}
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl text-white"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Navigate Addis Ababa with Confidence
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/80">
              Plan your journey, find the best routes, and stay informed about
              road conditions in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="gap-2 text-lg">
                <Link href="/map">
                  Plan Your Route <MapPin className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 text-lg bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Link href="/dashboard">
                  View Dashboard <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Animated Route Line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </section>

      {/* Features Section */}
      <AnimatedSection className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Transforming Urban Mobility
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Menged provides the tools you need to navigate Addis Ababa
              efficiently and stay informed.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Feature 1 */}
            <motion.div
              variants={itemVariant}
              className="bg-background border rounded-xl p-8 shadow-sm hover:shadow-md transition-all"
            >
              <div className="rounded-full bg-primary/10 p-4 inline-block mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Route Planning</h3>
              <p className="text-muted-foreground">
                Find the most efficient routes using public transport and
                walking directions, optimized for your needs.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              variants={itemVariant}
              className="bg-background border rounded-xl p-8 shadow-sm hover:shadow-md transition-all"
            >
              <div className="rounded-full bg-primary/10 p-4 inline-block mb-4">
                <Bus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-time Updates</h3>
              <p className="text-muted-foreground">
                Get live information about road closures, construction, and
                public transport delays affecting your journey.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              variants={itemVariant}
              className="bg-background border rounded-xl p-8 shadow-sm hover:shadow-md transition-all md:col-span-2 lg:col-span-1"
            >
              <div className="rounded-full bg-primary/10 p-4 inline-block mb-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Event Planning</h3>
              <p className="text-muted-foreground">
                Plan ahead with information about public holidays and special
                events that may impact transportation.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* How It Works Section */}
      <AnimatedSection className="py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How Menged Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our platform combines real-time data with advanced routing
              algorithms to provide the best possible journey planning
              experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-background rounded-xl p-8 shadow-md h-full"
              >
                <div className="rounded-full bg-primary w-12 h-12 flex items-center justify-center mb-6 text-white font-bold text-xl">
                  1
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Enter Your Destination
                </h3>
                <p className="text-muted-foreground">
                  Simply enter your starting point and destination on our
                  interactive map interface.
                </p>
              </motion.div>
            </div>

            {/* Step 2 */}
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-background rounded-xl p-8 shadow-md h-full"
              >
                <div className="rounded-full bg-primary w-12 h-12 flex items-center justify-center mb-6 text-white font-bold text-xl">
                  2
                </div>
                <h3 className="text-xl font-bold mb-2">View Route Options</h3>
                <p className="text-muted-foreground">
                  Compare multiple route options including transport modes,
                  duration, and distance.
                </p>
              </motion.div>
            </div>

            {/* Step 3 */}
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="bg-background rounded-xl p-8 shadow-md h-full"
              >
                <div className="rounded-full bg-primary w-12 h-12 flex items-center justify-center mb-6 text-white font-bold text-xl">
                  3
                </div>
                <h3 className="text-xl font-bold mb-2">Start Your Journey</h3>
                <p className="text-muted-foreground">
                  Follow the step-by-step directions with real-time updates
                  along your route.
                </p>
              </motion.div>
            </div>

            {/* Connecting Line */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              viewport={{ once: true }}
              className="absolute top-1/2 left-0 right-0 h-1 bg-primary/30 hidden md:block"
              style={{ transform: "translateY(-50%)" }}
            />
          </div>
        </div>
      </AnimatedSection>

      {/* Data & Analytics Section */}
      <AnimatedSection className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Powered by Real-Time Data
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Menged analyzes transportation patterns across Addis Ababa to
                provide accurate and reliable journey planning.
              </p>
              <ul className="space-y-4">
                <motion.li
                  whileInView={{ opacity: 1, x: 0 }}
                  initial={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Traffic Analysis</h3>
                    <p className="text-muted-foreground">
                      Historical and real-time traffic data informs our routing
                      suggestions.
                    </p>
                  </div>
                </motion.li>
                <motion.li
                  whileInView={{ opacity: 1, x: 0 }}
                  initial={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    <Bus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Transit Integration</h3>
                    <p className="text-muted-foreground">
                      Live transit schedules and updates from local
                      transportation providers.
                    </p>
                  </div>
                </motion.li>
              </ul>
            </div>

            {/* Animated Chart/Map Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="relative h-[400px] rounded-xl overflow-hidden shadow-xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1566169688293-b6340ba79fd5?q=80&w=1200&auto=format&fit=crop"
                alt="Transport data visualization"
                fill
                style={{ objectFit: "cover" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <p className="text-2xl font-bold">90%</p>
                <p>Improved journey time accuracy</p>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Commute?
          </h2>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-primary-foreground/80">
            Join thousands of Addis Ababa residents who are already using Menged
            to save time on their daily journeys.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="gap-2 text-lg px-8 py-6"
            >
              <Link href="/map">
                Start Planning Your Route <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </AnimatedSection>
    </div>
  );
}
