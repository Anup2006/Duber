'use client';

import Image from 'next/image';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';

import { Button } from '@/components/ui/button';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

export default function Home() {
  const features = [
    {
      title: 'Ride',
      desc: 'Request a ride in seconds, wherever you are.',
      img: "https://images.unsplash.com/photo-1556122071-e404eaedb77f", 
    },
    {
      title: 'Drive',
      desc: 'Earn on your own schedule with flexible driving.',
      img: 'https://images.unsplash.com/photo-1502877338535-766e1452684a',
    },
    {
      title: 'Safety',
      desc: 'Every trip is tracked and protected.',
      img: 'https://images.unsplash.com/photo-1520975916090-3105956dac38',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent)]" />
      
      <div className="relative z-10">
        {/* NAVBAR */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <h1 className="text-2xl font-bold tracking-tight">Uber</h1>

          <div className="flex gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-white">
                Sign In
              </Button>
            </Link>

            <Link href="/sign-up">
              <Button className="bg-white text-black hover:bg-gray-200">
                Sign Up
              </Button>
            </Link>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="flex flex-col items-center justify-center text-center px-6 py-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Request a ride now
          </h2>

          <p className="text-gray-400 max-w-xl mb-8">
            Book a ride instantly or schedule one for later. Safe, reliable,
            and affordable transportation at your fingertips.
          </p>

          <div className="flex gap-4">
            <Link href="/sign-up">
              <Button className="bg-white text-black hover:bg-gray-200">
                Get Started
              </Button>
            </Link>

            <Link href="/sign-in">
              <Button variant="outline" className="border-white text-black">
                Already have an account?
              </Button>
            </Link>
          </div>
        </section>

        {/* FEATURES CAROUSEL */}
        <section className="pt-5 px-6 py-16">
          <h3 className="text-3xl font-semibold text-center mb-12">
            Move the way you want
          </h3>

          <Carousel
            plugins={[Autoplay({ delay: 3000 })]}
            className="max-w-5xl mx-auto"
          >
            <CarouselContent>
              {features.map((item, index) => (
                <CarouselItem key={index}>
                  <div className="grid md:grid-cols-2 gap-6 items-center bg-white text-black rounded-2xl overflow-hidden shadow-xl">

                    {/* IMAGE */}
                    <div className="relative w-full h-72 md:h-full">
                      <Image
                        src={item.img}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* TEXT */}
                    <div className="p-8">
                      <h4 className="text-2xl font-bold mb-4">
                        {item.title}
                      </h4>

                      <p className="text-gray-600 mb-6">
                        {item.desc}
                      </p>

                      <Button className="bg-black text-white hover:bg-gray-800">
                        Learn More
                      </Button>
                    </div>

                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </section>

        {/* FOOTER */}
        <footer className="text-center p-6 border-t border-gray-800 text-gray-400">
          © 2026 Uber Clone. All rights reserved.
        </footer>
      </div>
    </div>
  );
}