"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import MapView from "@/components/MapView";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Navigation,
  Shield,
  Car,
  Loader2,
  Star,
  Clock3,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { getSocket } from "@/lib/socketClient";
import { Socket } from "socket.io-client";
import { useRef } from "react";

type Ride = {
  _id: string;

  fare: number;

  distanceKm:number;

  status: string;

  pickup: {
    lat: number;
    lng: number;
    address?: string;
  };

  drop: {
    lat: number;
    lng: number;
    address?: string;
  };
};

export default function DriverDashboard() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [driverCoords, setDriverCoords] =useState<[number, number]>();
  const [pickupCoords, setPickupCoords] =useState<[number, number]>();
  const [dropCoords, setDropCoords] =useState<[number, number]>();
  const [route, setRoute] =useState<[number, number][]>([]);
  const [rideStatus, setRideStatus] =useState<string | null>(null);
  const router = useRouter();
  const {data: session,} = useSession();
  const socketRef = useRef<Socket | null>(null);
  const ridesRef = useRef<Ride[]>([]);
  const [completedRideId, setCompletedRideId] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] =useState("");
  const SHEET_COLLAPSED = 180;
  const SHEET_MID = 420;
  const SHEET_EXPANDED = 650;  
  const [sheetHeight, setSheetHeight] = useState(SHEET_COLLAPSED);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    ridesRef.current = rides;
  }, [rides]);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.connect();

    socket.on("connect", () => {
      console.log("CONNECTED:", socket.id);

      const activeRide = ridesRef.current.find(
        (r) =>
          r.status === "accepted" ||
          r.status === "arriving" ||
          r.status === "started"
      );

      if (activeRide) {
        socket.emit("join-ride", activeRide._id);
      }
    });

    socket.on("ride-status", (data) => {
      console.log("RIDE STATUS EVENT:", data);

      setRideStatus(data.status);

      if (data.status === "completed") {
        setCompletedRideId(data.rideId);

        setRoute([]);
        setPickupCoords(undefined);
        setDropCoords(undefined);
        setDriverCoords(undefined);

        setRides([]);

        setRideStatus("completed");
      }
    });

    return () => {
      socket.off("connect");
      socket.off("ride-status");
    };
    }, []);


  useEffect(() => {
    const setOnline = async () => {

      await fetch("/api/drivers/availability", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          userId: session?.user?._id,
          isAvailable: true,
        }),
      });

    };

    if (session?.user?._id) {
      setOnline();
    }

  }, [session]);

  useEffect(() => {
    const setOffline = async () => {

      await fetch("/api/drivers/availability", {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          userId: session?.user?._id,
          isAvailable: false,
        }),
      });

    };

    window.addEventListener(
      "beforeunload",
      setOffline
    );

    return () => {

      setOffline();

      window.removeEventListener(
        "beforeunload",
        setOffline
      );

    };

  }, [session]);
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const activeRide = rides.find(
      (r) =>
        r.status === "accepted" ||
        r.status === "arriving" ||
        r.status === "started"
    );

    if (activeRide) {
      socket.emit("join-ride", activeRide._id);
    }
  }, [rides]);

  const rejectRide = async (rideId: string) => {
    try {
      await fetch("/api/drivers/reject-ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId }),
      });

      setRoute([]);
      setRideStatus(null);

      fetchRides(); // refresh list
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const checkDriver =
      async () => {

      try {

        const res =
          await fetch(
            `/api/drivers/check?userId=${session?.user?._id}`
          );

        const data =
          await res.json();

        if (
          !data.exists
        ) {
          router.push(
            "/driver/setup"
          );
        }

      } catch (error) {

        console.log(error);
      }
    };

    if (
      session?.user?._id
    ) {
      checkDriver();
    }

  }, [session]);

  const fetchRides = async () => {
    try {
      const res = await fetch(
        `/api/drivers/ride?userId=${session?.user?._id}`
      );

      const data = await res.json();

      const filtered = data.filter(
        (ride: Ride) => ride.status !== "completed"
      );

      setRides(filtered);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
   if (!session?.user?._id) return;

   fetchRides();

   const interval = setInterval(() => {
     fetchRides();
   }, 5000);

   return () => clearInterval(interval);

  }, [session]);
  
  const acceptRide = async (ride: Ride) => {
    try {
      await fetch("/api/drivers/accept-ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId: ride._id }),
      });

      await fetchRides(); // 🔥 ALWAYS REFRESH FROM SERVER

      setPickupCoords([ride.pickup.lat, ride.pickup.lng]);
      setDropCoords([ride.drop.lat, ride.drop.lng]);
    } catch (error) {
      console.log(error);
    }
  };

  const updateRideStatus = async (rideId: string, status: string) => {
    try {
      await fetch("/api/ride/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId, status }),
      });

      setRideStatus(status);
      if (status !== "completed") {
        await fetchRides();
      }

      if (status === "completed") {
        setRideStatus("completed");
        setCompletedRideId(rideId);
        setRoute([]);
        setPickupCoords(undefined);
        setDropCoords(undefined);
        setDriverCoords(undefined);

        // 🚨 IMPORTANT: prevent rides[] from restoring old state
        setRides([]);

        return;
      }

      let target: [number, number] | undefined;

      if (status === "arriving") {
        target = pickupCoords;
      } else if (status === "started") {
        target = dropCoords;
      }

      if (!driverCoords || !target) return;

      const res = await fetch("/api/ride/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: driverCoords,
          drop: target,
        }),
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        const formatted: [number, number][] = data.map(
          (p: number[]) => [p[1], p[0]]
        );

        setRoute(formatted);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const verifyOtp = async (
    rideId: string,
    otp: string
  ) => {

    try {

      const res =
        await fetch(
          "/api/ride/verify-otp",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              rideId,
              otp,
            }),
          }
        );

      const data =
        await res.json();

      if (!data.success) {

        alert("Invalid OTP");

        return;
      }

      alert("Ride Started");

      setEnteredOtp("");

      await fetchRides();

      setRideStatus("started");

    } catch (error) {

      console.log(error);

    }
  };

  useEffect(() => {
    if (!driverCoords || !pickupCoords) return;

    const fetchRoute = async () => {
      try {
        const res = await fetch("/api/ride/route", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickup: driverCoords,
            drop: rideStatus === "started" ? dropCoords : pickupCoords,
          }),
        });

        const data = await res.json();

        if (!Array.isArray(data)) return;

        const formatted: [number, number][] = data.map(
          (p: number[]) => [p[1], p[0]] as [number, number]
        );

        setRoute(formatted);
      } catch (err) {
        console.log(err);
      }
    };

    fetchRoute();

    const interval = setInterval(fetchRoute, 8000);

    return () => clearInterval(interval);
  }, [driverCoords, pickupCoords, dropCoords, rideStatus]);

  useEffect(() => {
    if (!session?.user?._id) {
      return;
    }

    const watchId =
      navigator.geolocation.watchPosition(

        async (position) => {

          const lat =
            position.coords.latitude;

          const lng =
            position.coords.longitude;

          setDriverCoords([
            lat,
            lng,
          ]);

          try {

            await fetch(
              "/api/drivers/update-location",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    userId:
                      session.user._id,
                    lat,
                    lng,
                  }),
              }
            );

            // SOCKET EMIT

            const activeRide =
              ridesRef.current.find(
                (ride) =>
                  ride.status ===
                    "accepted" ||
                  ride.status ===
                    "arriving" ||
                  ride.status ===
                    "started"
              );

            if (activeRide) {

              socketRef.current?.emit(
                "driver-location",
                {
                  rideId:
                    activeRide._id,

                  driver: {
                    _id:
                      session.user._id,

                    currentLocation: {
                      lat,
                      lng,
                    },
                  },

                  status:
                    activeRide.status,
                }
              );

            }

          } catch (error) {

            console.log(error);

          }

        },

        (error) => {

          console.log(error);

        },

        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }

      );

    return () => {

      navigator.geolocation.clearWatch(
        watchId
      );

    };

  }, [session, rides]);

  useEffect(() => {
    if (!rides.length) return;

    const activeRide = rides.find(
      (ride) =>
        ride.status === "accepted" ||
        ride.status === "arriving" ||
        ride.status === "started"
    );

    if (!activeRide) {
      setRoute([]);
      setPickupCoords(undefined);
      setDropCoords(undefined);
      return;
    }

    // 🚨 HARD BLOCK COMPLETED RIDE RESTORE
    if (completedRideId && activeRide._id === completedRideId) return;

    setPickupCoords([activeRide.pickup.lat, activeRide.pickup.lng]);
    setDropCoords([activeRide.drop.lat, activeRide.drop.lng]);
    setRideStatus(activeRide.status);
  }, [rides, completedRideId]);

  return (
  <div className="h-screen w-full relative overflow-hidden bg-black">

    {/* MAP */}
    <div className="absolute inset-0 z-0 pointer-events-auto">
      <MapView
        pickup={pickupCoords}
        drop={dropCoords}
        route={rideStatus === "completed" ? [] : route}
        drivers={
          driverCoords
            ? [
                {
                  currentLocation: {
                    lat: driverCoords[0],
                    lng: driverCoords[1],
                  },
                },
              ]
            : []
        }
        rideStatus={rideStatus}
      />
    </div>

    {/* DARK OVERLAY */}
    <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />

    {/* NAVBAR */}
    <div className="absolute top-0 left-0 right-0 z-40">
      <Navbar />
    </div>

    {/* BOTTOM SHEET */}
    <motion.div
      style={{ height: sheetHeight }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragEnd={(event, info) => {
        const dragDistance = info.offset.y;

        if (dragDistance < -80) {
          if (sheetHeight === SHEET_COLLAPSED) {
            setSheetHeight(SHEET_MID);
          } else {
            setSheetHeight(SHEET_EXPANDED);
          }
        }

        // dragging DOWN (positive)
        else if (dragDistance > 80) {
          if (sheetHeight === SHEET_EXPANDED) {
            setSheetHeight(SHEET_MID);
          } else {
            setSheetHeight(SHEET_COLLAPSED);
          }
        }
      }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 20,
      }}
      className="
        absolute
        bottom-0
        left-0
        right-0
        z-50
        rounded-t-[32px]
        bg-white/95
        backdrop-blur-xl
        shadow-2xl
        border-t
        flex
        flex-col
      "
    >
      <div
        className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing"
      >
        <div className="h-1.5 w-14 rounded-full bg-gray-300" ></div>
      </div>

      <div
        className="
          flex-1
          overflow-y-auto
          overscroll-contain
          p-5 md:p-6
          space-y-5
        "
        >
        <div className="p-5 md:p-6 space-y-5">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage ride requests in real-time
            </p>
          </div>

          <div className="h-14 w-14 rounded-2xl bg-black text-white flex items-center justify-center">
            <Car className="h-7 w-7" />
          </div>
        </div>

        {/* RIDES LIST */}
        <div className="space-y-4">
          {rides.map((ride) => (
            <motion.div
              key={ride._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
              className="
                relative
                rounded-3xl
                bg-gradient-to-br from-white to-gray-50
                border
                shadow-md
                hover:shadow-xl
                p-5
                overflow-hidden
              "
            >
              {/* subtle glow background */}
              <div className="absolute inset-0 opacity-30 pointer-events-none bg-gradient-to-r from-gray-100 to-transparent" />

              {/* HEADER */}
              <div className="flex items-start justify-between relative">
                <div>
                  <p className="font-semibold text-gray-900">
                    Ride Request
                  </p>

                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`
                      inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        ride.status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : ride.status === "started"
                          ? "bg-blue-100 text-blue-700"
                          : ride.status === "completed"
                          ? "bg-gray-200 text-gray-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    `}
                  >
                    ● {ride.status.toUpperCase()}
                  </motion.span>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">Fare</p>
                  <motion.p
                    key={ride.fare}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-gray-900"
                  >
                    ₹ {ride.fare}
                  </motion.p>
                </div>
              </div>

              {/* LOCATION */}
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 mt-1 rounded-full bg-green-500" />
                  <span>{ride.pickup.address}</span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 mt-1 rounded-full bg-red-500" />
                  <span>{ride.drop.address}</span>
                </div>
              </div>

              {/* DISTANCE */}
              <div className="mt-3 text-sm font-medium text-gray-800">
                🚗 {ride.distanceKm.toFixed(2)} km
              </div>

              {/* OTP SECTION */}
              {ride.status === "arriving" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-2"
                >
                  <input
                    type="text"
                    placeholder="Enter Rider OTP"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    className="
                      w-full
                      border
                      rounded-2xl
                      px-3 py-2
                      outline-none
                      focus:ring-2 focus:ring-black/20
                    "
                  />

                  <Button
                    className="w-full"
                    disabled={loadingAction === `verify-${ride._id}`}
                    onClick={async () => {
                      setLoadingAction(`verify-${ride._id}`);
                      try {
                        await verifyOtp(ride._id, enteredOtp);
                      } finally {
                        setLoadingAction(null);
                      }
                    }}
                  >
                    {loadingAction === `verify-${ride._id}` ? "Verifying..." : "Verify OTP & Start Ride"}
                  </Button>
                </motion.div>
              )}

              {/* ACTIONS */}
              <div className="flex gap-2 mt-4 flex-wrap relative">
                {ride.status === "searching" && (
                  <Button
                    disabled={loadingAction === `accept-${ride._id}`}
                    onClick={async () => {
                      setLoadingAction(`accept-${ride._id}`);
                      try {
                        await acceptRide(ride);
                      } finally {
                        setLoadingAction(null);
                      }
                    }}
                  >
                    {loadingAction === `accept-${ride._id}` ? "Accepting..." : "Accept"}
                  </Button>
                )}

                {ride.status === "accepted" && (
                  <Button
                    disabled={loadingAction === `arriving-${ride._id}`}
                    onClick={async () => {
                      setLoadingAction(`arriving-${ride._id}`);
                      try {
                        await updateRideStatus(ride._id, "arriving");
                      } finally {
                        setLoadingAction(null);
                      }
                    }}
                  >
                    {loadingAction === `arriving-${ride._id}` ? "Updating..." : "Arriving"}
                  </Button>
                )}

                {ride.status === "started" && (
                  <Button
                    disabled={loadingAction === `complete-${ride._id}`}
                    onClick={async () => {
                      setLoadingAction(`complete-${ride._id}`);
                      try {
                        await updateRideStatus(ride._id, "completed");
                      } finally {
                        setLoadingAction(null);
                      }
                    }}
                  >
                    {loadingAction === `complete-${ride._id}` ? "Completing..." : "Complete"}
                  </Button>
                )}

                {ride.status !== "started" && (
                <Button
                  variant="destructive"
                  disabled={loadingAction === `reject-${ride._id}`}
                  onClick={async () => {
                    setLoadingAction(`reject-${ride._id}`);
                    try {
                      await rejectRide(ride._id);
                    } finally {
                      setLoadingAction(null);
                    }
                  }}
                >
                  {loadingAction === `reject-${ride._id}` ? "Rejecting..." : "Reject"}
                </Button>
                )}
              </div>
            </motion.div>
          ))}

        </div>
      </div>    
      </div>
    </motion.div>

  </div>
);
}

      
