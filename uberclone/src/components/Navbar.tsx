// 'use client';

// import React from 'react';
// import Link from 'next/link';
// import { useSession, signOut } from 'next-auth/react';
// import { Button } from './ui/button';
// import { motion } from 'framer-motion';
// import { Menu } from 'lucide-react';

// function Navbar() {
//   const { data: session } = useSession();
//   const user = session?.user as any;

//   const isDriver = user?.role === 'DRIVER';

//   return (
    
//     <motion.nav
//       initial={{ y: -15, opacity: 0 }}
//       animate={{ y: 0, opacity: 1 }}
//       transition={{ duration: 0.35 }}
//       className="
//         sticky top-0 z-50
//         backdrop-blur-xl
//         bg-black/40
//         border-b border-white/10
//         text-white
//       "
//     >
//       <div className="flex items-center justify-between px-4 md:px-6 py-4">

//         {/* BRAND */}
//         <Link
//           href="#"
//           className="text-lg font-bold tracking-wide hover:opacity-80 transition"
//         >
//           RIDEX
//         </Link>

//         {/* RIGHT SIDE */}
//         <div className="flex items-center gap-3">

//           {/* DRIVER MENU BUTTON */}
//           {session && isDriver && (
//             <motion.button
//               whileTap={{ scale: 0.9 }}
//               className="
//                 h-10 w-10
//                 rounded-full
//                 bg-white/10
//                 border border-white/20
//                 flex items-center justify-center
//                 hover:bg-white/20
//                 transition
//               "
//             >
//               <Menu className="h-5 w-5 text-white" />
//             </motion.button>
//           )}

//           {/* USER BADGE (optional minimal) */}
//           {session && (
//             <div className="
//               hidden sm:flex items-center gap-2
//               px-3 py-1.5
//               rounded-full
//               bg-white/10
//               border border-white/10
//             ">
//               <div className="
//                 h-7 w-7 rounded-full
//                 bg-gradient-to-br from-gray-700 to-black
//                 flex items-center justify-center
//                 text-xs font-semibold
//               ">
//                 {user?.name?.charAt(0) || 'U'}
//               </div>

//               <span className="text-sm text-white/90 truncate max-w-[140px]">
//                 {user?.name || user?.email}
//               </span>
//             </div>
//           )}

//           {/* AUTH BUTTON */}
//           {session ? (
//             <motion.div whileTap={{ scale: 0.95 }}>
//               <Button
//                 onClick={() => signOut()}
//                 className="
//                   bg-white text-black
//                   hover:bg-gray-200
//                   rounded-full
//                   px-5 py-2 text-sm
//                 "
//               >
//                 Logout
//               </Button>
//             </motion.div>
//           ) : (
//             <motion.div whileTap={{ scale: 0.95 }}>
//               <Link href="/sign-in">
//                 <Button
//                   className="
//                     bg-white text-black
//                     hover:bg-gray-200
//                     rounded-full
//                     px-5 py-2 text-sm
//                   "
//                 >
//                   Login
//                 </Button>
//               </Link>
//             </motion.div>
//           )}

//         </div>
//       </div>
//     </motion.nav>
//   );
// }

// export default Navbar;

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, BarChart3, MapPin, User } from 'lucide-react';

function Navbar() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [open, setOpen] = useState(false);
  const isDriver = user?.role === 'DRIVER';

  const navItems = [
    { label: 'Dashboard', href: '/driver/dashboard', icon: Home },
    { label: 'Analytics', href: '/driver/analytics', icon: BarChart3 },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="
          sticky top-0 z-50
          backdrop-blur-xl
          bg-black/40
          border-b border-white/10
          text-white
        "
      >
        <div className="flex items-center justify-between px-4 md:px-6 py-4">

          <Link
            href="#"
            className="text-lg font-bold tracking-wide"
          >
            RIDEX
          </Link>

          <div className="flex items-center gap-3">

            {session && isDriver && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setOpen(true)}
                className="
                  h-10 w-10
                  rounded-full
                  bg-white/10
                  border border-white/20
                  flex items-center justify-center
                "
              >
                <Menu className="h-5 w-5" />
              </motion.button>
            )}

            {session && (
              <div className="
                hidden sm:flex items-center gap-2
                px-3 py-1.5
                rounded-full
                bg-white/10
                border border-white/10
              ">
                <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm truncate max-w-[140px]">
                  {user?.name || user?.email}
                </span>
              </div>
            )}

            {session ? (
              <Button
                onClick={() => signOut()}
                className="bg-white text-black rounded-full px-5"
              >
                Logout
              </Button>
            ) : (
              <Link href="/sign-in">
                <Button className="bg-white text-black rounded-full px-5">
                  Login
                </Button>
              </Link>
            )}

          </div>
        </div>
      </motion.nav>

      
      <AnimatePresence>
        {open && (
          <>
            {/* BACKDROP */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />

            {/* DRAWER */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
              className="
                fixed top-0 right-0 h-full w-[320px]
                bg-gradient-to-b from-[#0b0b0f] to-[#07070a]
                border-l border-white/10
                z-50
                flex flex-col
                shadow-2xl
              "
            >
              {/* HEADER */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-white tracking-wide">
                    Driver Menu
                  </h2>

                  <p className="text-xs text-white/40">
                    Quick navigation & controls
                  </p>

                  <div className="flex items-center gap-3 mt-3 px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition">

                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-semibold text-white shadow-md">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-white truncate max-w-[160px]">
                        {user?.name || "Unknown User"}
                      </span>

                      <span className="text-[11px] text-white/40 truncate max-w-[160px]">
                        {user?.email}
                      </span>
                    </div>

                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition"
                >
                  <X className="h-5 w-5 text-white" />
                </button>

              </div>

              {/* NAV LINKS */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navItems.map((item, i) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={i}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="
                        group flex items-center gap-3
                        px-4 py-3
                        rounded-xl
                        text-white/80
                        hover:text-white
                        hover:bg-white/10
                        transition-all duration-200
                      "
                    >
                      {/* ICON WRAP */}
                      <div
                        className="
                          h-9 w-9 rounded-lg
                          bg-white/5 group-hover:bg-white/10
                          flex items-center justify-center
                          transition
                        "
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>

                      {/* LABEL */}
                      <span className="text-sm font-medium">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* FOOTER */}
              <div className="px-5 py-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40">
                    RIDEX Driver Panel
                  </p>

                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;