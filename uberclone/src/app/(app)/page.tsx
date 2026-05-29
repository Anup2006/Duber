'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col">

      {/* BACKGROUND */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:40px_40px]" />

      {/* GLOW ORBS */}
      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-cyan-500/30 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full" />

      {/* NAV */}
      <header className="relative z-10 flex justify-between items-center px-6 md:px-8 py-6">
        <h1 className="text-xl font-bold tracking-widest">RIDEX</h1>

        <div className="flex gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Login
            </Button>
          </Link>

          <Link href="/sign-up">
            <Button className="bg-white text-black hover:bg-gray-200">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center px-6 md:px-8 pt-6 md:pt-12 max-w-6xl mx-auto flex-1">

        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="order-2 md:order-1"
        >

          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Ride.
            <br />
            <span className="text-cyan-400">Anytime.</span>
            <br />
            Anywhere.
          </h1>

          <p className="text-gray-400 mt-6 max-w-md">
            Instant ride booking with live tracking, transparent pricing, and verified drivers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button className="w-full bg-cyan-500 text-black px-6 py-6 rounded-2xl hover:scale-105 transition">
                Book a Ride
              </Button>
            </Link>

            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button className="w-full border border-white/20 text-white px-6 py-6 rounded-2xl hover:bg-white/10">
                Become a Driver
              </Button>
            </Link>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4 mt-10 text-center md:text-left text-sm text-gray-400">

            <div>
              <p className="text-white text-xl font-bold">10K+</p>
              Riders
            </div>

            <div>
              <p className="text-white text-xl font-bold">5K+</p>
              Drivers
            </div>

            <div>
              <p className="text-white text-xl font-bold">4.9★</p>
              Rating
            </div>

          </div>

        </motion.div>

        {/* RIGHT MAP */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="order-1 md:order-2 w-full"
        >

          <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black h-[380px] sm:h-[450px] md:h-[520px] relative">

            {/* GRID */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* ROAD */}
            <div className="absolute top-1/3 left-10 right-10 h-[2px] bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 opacity-60 blur-[1px]" />

            {/* CAR */}
            <motion.div
              animate={{ x: [0, 120, 0], y: [0, 20, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute top-1/3 left-10 md:left-20"
            >
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-cyan-500 flex items-center justify-center">
                🚗
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, -6, 0] }} 
              transition={{ duration: 2, repeat: Infinity }} 
              className="absolute bottom-24 left-16" > 
              <div className="relative"> 
                <div className="h-4 w-4 bg-green-400 rounded-full animate-ping absolute" /> 
                <div className="h-3 w-3 bg-green-500 rounded-full relative" /> </div> 
                <p className="text-xs text-green-400 mt-1">Pickup</p> 
            </motion.div> 
            
            {/* DROP PIN */} 
            <motion.div 
            animate={{ y: [0, -6, 0] }} 
            transition={{ duration: 2.5, repeat: Infinity }} 
            className="absolute top-20 right-16" > 
              <div className="relative"> 
                  <div className="h-4 w-4 bg-red-400 rounded-full animate-ping absolute" /> 
                  <div className="h-3 w-3 bg-red-500 rounded-full relative" /> </div> 
                  <p className="text-xs text-red-400 mt-1">Drop</p> 
            </motion.div>

            {/* STATUS */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4">

              <div className="flex items-center justify-between">

                <p className="text-sm md:text-base font-medium">
                  Driver arriving in 4 min
                </p>

                <p className="text-cyan-400 text-xs md:text-sm animate-pulse">
                  ● LIVE
                </p>

              </div>

            </div>

          </div>

        </motion.div>

      </section>

      {/* FEATURES */}
      <section className="relative z-10 mt-16 md:mt-24 px-6 max-w-6xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">

          {[
            ["Instant Matching", "Get a driver in seconds"],
            ["Live Tracking", "Real-time GPS updates"],
            ["Safe Payments", "Encrypted & secure"],
          ].map(([title, desc], i) => (
            <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/5">
              <h3 className="font-semibold text-cyan-300">{title}</h3>
              <p className="text-gray-400 text-sm mt-2">{desc}</p>
            </div>
          ))}

        </div>

      </section>

      {/* CTA */}
      <section className="relative z-10 text-center py-20 md:py-24">

        <h2 className="text-3xl md:text-4xl font-bold">
          Ready to move smarter?
        </h2>

        <p className="text-gray-400 mt-3">
          Join the next generation of ride experience.
        </p>

        <Link href="/sign-up">
          <Button className="mt-8 bg-cyan-500 text-black px-8 py-6 rounded-2xl hover:scale-105 transition">
            Get Started
          </Button>
        </Link>

      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/10 mt-auto py-6 px-6 text-center text-gray-400 text-sm">

        <div className="flex flex-col md:flex-row items-center justify-between gap-3">

          <p>© 2026 RIDEX. All rights reserved.</p>

          <div className="flex gap-4">
            <Link href="#" className="hover:text-white">Privacy</Link>
            <Link href="#" className="hover:text-white">Terms</Link>
            <Link href="#" className="hover:text-white">Contact</Link>
          </div>

        </div>

      </footer>

    </div>
  );
}