"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import MapView from "@/components/MapView";
import { getSocket } from "@/lib/socketClient";
import LocationInput from "@/components/LocationInput";
import { getDistanceMeters } from "@/lib/distance";
import Navbar from "@/components/Navbar";
import { Socket } from "socket.io-client";
import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RateDriver from "@/components/RateDriver";
import {
  Car,
  Clock3,
  Phone,
  Star,
  Loader2,
  Navigation,
  Shield,
} from "lucide-react";

export default function RiderDashboard() {
  const SHEET_COLLAPSED = 180;
  const SHEET_MID = 420;
  const SHEET_EXPANDED = 650;   
  const [pickupCoords, setPickupCoords] = useState<[number, number]>();
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropAddress, setDropAddress] = useState("");
  const [dropCoords, setDropCoords] = useState<[number, number]>();
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [fare, setFare] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [rideId, setRideId] = useState<string | null>(null);
  const [rideStatus, setRideStatus] =useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] =useState<any>(null);
  const [eta, setEta] =useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { data: session } = useSession();
  const [driverCoords, setDriverCoords] = useState<[number, number]>();
  const joinedRideRef = useRef<string | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<any[]>([]);
  const [activeDriver, setActiveDriver] = useState<any | null>(null);
  const [rejectedDrivers, setRejectedDrivers] = useState<string[]>([]);
  const [rideOtp, setRideOtp] =useState("");
  const [sheetHeight, setSheetHeight] = useState(SHEET_COLLAPSED);
  const [showRating, setShowRating] = useState(false);

  const resetRide = () => {
    if (rideId) {
      socketRef.current?.emit("leave-ride", rideId);
    }
    setRideId(null);
    setRideStatus(null);
    setRoute([]);
    setNearbyDrivers([]);
    setActiveDriver(null);
    setFare(null);
    setDistance(null);
    setEta(null);
    setSelectedDriver(null);
    setDriverCoords(undefined);
    setPickupCoords(undefined);
    joinedRideRef.current = null;
    setDropCoords(undefined);
    setRejectedDrivers([]);
  };

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.connect();

    socket.on("connect", () => {
      console.log("CONNECTED:", socket.id);
      if (rideId) {
        socket.emit("join-ride", rideId);
      }
    });

    socket.on("connect_error", (err) => {
      console.log("SOCKET ERROR:", err);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !rideId) return;

    if (!socket.connected) {
      socket.connect();
    }

    if (joinedRideRef.current === rideId) return;

    socket.emit("join-ride", rideId);

    joinedRideRef.current = rideId;

  }, [rideId]);

  const calculateTotalDistance = (route: [number, number][]) => {
    let distance = 0;

    for (let i = 1; i < route.length; i++) {
        distance += getDistanceMeters(route[i - 1], route[i]);
    }

    return distance / 1000; // km
  };

  const calculateFare = (km: number) => {
    const BASE_FARE = 30;
    const PER_KM = 20;

    return Math.round(BASE_FARE + km * PER_KM);
  };

  const calculateETA = (
    route: [number, number][]
  ) => {

    if (route.length < 2) {
      return null;
    }

    let totalMeters = 0;

    for (let i = 1; i < route.length; i++) {

      totalMeters += getDistanceMeters(
        route[i - 1],
        route[i]
      );

    }

    // average city speed
    const AVG_SPEED_KMH = 30;

    const hours =
      (totalMeters / 1000) / AVG_SPEED_KMH;

    const minutes =
      Math.ceil(hours * 60);

    return minutes;
  };

  const calculateDriverETA = (
    driverCoords: [number, number],
    pickupCoords: [number, number]
  ) => {

    const distanceMeters =
      getDistanceMeters(
        driverCoords,
        pickupCoords
      );

    const avgSpeedKmph = 30;

    const etaMinutes =
      (distanceMeters / 1000) /
      avgSpeedKmph *
      60;

    return Math.max(
      1,
      Math.round(etaMinutes)
    );
  };

  const handleFindRide = async () => {
    if (!pickupCoords || !dropCoords) return;

    try {
      setLoading(true);

      // CREATE RIDE REQUEST
      await fetch("/api/ride/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup: pickupCoords,
          drop: dropCoords,
        }),
      });

      // FETCH ROUTE
      const res = await fetch("/api/ride/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup: pickupCoords,
          drop: dropCoords,
        }),
      });

      const text = await res.text();

      // EMPTY RESPONSE
      if (!text) {
        console.log("EMPTY RESPONSE");
        setRoute([]);
        return;
      }

      // SAFE PARSE
      const data = JSON.parse(text);

      console.log("ROUTE DATA:", pickupCoords,dropCoords);

      // INVALID ROUTE
      if (!Array.isArray(data) || data.length === 0) {
        console.log("NO ROUTE FOUND");
        setRoute([]);
        return;
      }

      // FORMAT ROUTE
      const formattedRoute = data.map(
        (p: number[]) => [p[1], p[0]] as [number, number]
      );

      setRoute(formattedRoute);

      // DISTANCE + FARE
      const distanceKm = calculateTotalDistance(formattedRoute);

      const calculatedFare = calculateFare(distanceKm);

      setDistance(distanceKm);
      setFare(calculatedFare);

      // FETCH DRIVERS
      const driversRes = await fetch(`/api/drivers/nearby?lat=${pickupCoords[0]}&lng=${pickupCoords[1]}`);

      const driversText = await driversRes.text();

      const driversData = driversText
        ? JSON.parse(driversText)
        : [];

      setNearbyDrivers(
        driversData.filter(
          (driver: any) => !rejectedDrivers.includes(driver._id)
        )
      );

    } catch (error) {
      console.error("FIND RIDE ERROR:", error);

      setRoute([]);
      setNearbyDrivers([]);
      setFare(null);

    } finally {
      // ALWAYS RUNS
      setLoading(false);
    }
  };

  const handleSelectDriver = async (driver: any) => {
    try {

      const res = await fetch("/api/ride/create", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          riderId: session?.user?._id,

          driverId: driver._id,

          pickup: {
            lat: pickupCoords?.[0],
            lng: pickupCoords?.[1],
            address: pickupAddress,
          },

          drop: {
            lat: dropCoords?.[0],
            lng: dropCoords?.[1],
            address: dropAddress,
          },

          distanceKm: distance,

          fare,
        }),
      });

      const data = await res.json();
      setRideStatus(data.ride.status);
      setRideId(data.ride._id);
      setSelectedDriver(driver);
      setActiveDriver(driver);
      setNearbyDrivers([]);

      setDriverCoords([
        driver.currentLocation.lat,
        driver.currentLocation.lng,
      ]);


      alert("Ride created successfully!");

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!pickupCoords || !dropCoords) return;

    if (rideStatus === "completed") return;

    const fetchRoute = async () => {
      let pickup: [number, number];
      let drop: [number, number];

      if (rideId && driverCoords) {
        pickup = driverCoords;

        drop =
          rideStatus === "started"
            ? (dropCoords as [number, number])
            : (pickupCoords as [number, number]);
      } else {
        pickup = pickupCoords as [number, number];
        drop = dropCoords as [number, number];
      }

      const res = await fetch("/api/ride/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickup, drop }),
      });

      const data = await res.json();

      if (!Array.isArray(data)) return;

      const formatted: [number, number][] = data.map(
        (p: number[]) => [p[1], p[0]]
      );

      setRoute(formatted);
    };

    fetchRoute();
  }, [pickupCoords, dropCoords, rideId, rideStatus,driverCoords]);

  useEffect(() => {
    if (!route.length) {
      return;
    }

    const newEta =
      calculateETA(route);

    setEta(newEta);

  }, [route]);
    
  useEffect(() => {
    if (!eta || eta <= 0) {
      return;
    }

    const interval =
      setInterval(() => {

        setEta((prev) => {

          if (!prev || prev <= 1) {

            clearInterval(interval);

            return 1;
          }

          return prev - 1;

        });

      }, 60000);

    return () =>
      clearInterval(interval);

  }, [eta]);

  useEffect(() => {
    if (!pickupCoords || rideId) {return;}

    const interval =
      setInterval(async () => {

        try {

          const res =
            await fetch(
              `/api/drivers/nearby?lat=${pickupCoords[0]}&lng=${pickupCoords[1]}`
            );

          const data =
            await res.json();

          setNearbyDrivers(
            data.filter((driver: any) => !rejectedDrivers.includes(driver._id))
          );

        } catch (error) {

          console.log(error);

        }

      }, 15000);

    return () =>
      clearInterval(interval);

  }, [pickupCoords, rideId, rejectedDrivers]);

  useEffect(() => {
    if (!rideId) return;
    const socket = socketRef.current;

    if (!socket) return;

    const handleDriverLocation = async (data: any) => {
      console.log("SOCKET DRIVER:", data);

      const driver = data.driver;

      if (!driver) return;

      setActiveDriver((prev: any) => ({
        ...prev,
        ...driver,
        currentLocation: driver.currentLocation,
      }));
      setRideStatus(data.status);

      const target =
        data.status === "started"
          ? dropCoords
          : pickupCoords;

      if (!target) return;

      try {
        const routeRes = await fetch("/api/ride/route", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pickup: [
              driver.currentLocation.lat,
              driver.currentLocation.lng,
            ],
            drop: target,
          }),
        });

        const routeData = await routeRes.json();

        if (Array.isArray(routeData)) {
          const formatted = routeData.map(
            (p: number[]) => [p[1], p[0]] as [number, number]
          );

          setRoute(formatted);
        }

      } catch (err) {
        console.log(err);
      }
    };

    socket.on("driver-location", handleDriverLocation);

    return () => {
      socket.off("driver-location", handleDriverLocation);
    };
    }, [rideId, pickupCoords, dropCoords]);

  useEffect(() => {
    if (!rideId) return;
    const socket = socketRef.current;

    if (!socket) return;
    console.log("JOINED ROOM:", rideId);

    const handleRideStatus = async (data: any) => {
      console.log("RIDE STATUS:", data);

      setRideStatus(data.status);
      if (data.tripOtp) {
        setRideOtp(data.tripOtp);
      }

      // DRIVER REJECTED
      if (data.status === "rejected") {
        alert("Driver rejected the ride request");

        const rejectedId = data.driverId;

        setRejectedDrivers(prev => {
          const updated = [...prev, rejectedId];

          // IMPORTANT: use updated list immediately
          fetchNearbyDrivers(updated);

          return updated;
        });

        setSelectedDriver(null);
        setActiveDriver(null);
        setDriverCoords(undefined);
        setRideStatus(null);
        setRideId(null);

    

        // restore pickup -> drop route
        if (pickupCoords && dropCoords) {
          const res = await fetch("/api/ride/route", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pickup: pickupCoords,
              drop: dropCoords,
            }),
          });

          const routeData = await res.json();

          if (Array.isArray(routeData)) {
            const formatted = routeData.map(
              (p: number[]) =>
                [p[1], p[0]] as [number, number]
            );

            setRoute(formatted);
          }
        }
      
        

        return;
      }

      // TRIP COMPLETED
      if (data.status === "completed") {
        alert("Completed the Ride");
        setRideStatus("completed");
        setShowRating(true);

        setTimeout(() => {
          resetRide();
        }, 7000);

        return;
      }
    };

    socket.on("ride-status", handleRideStatus);

    return () => {
      socket.off("ride-status", handleRideStatus);
    };

  }, [rideId, pickupCoords, dropCoords]);

  const fetchNearbyDrivers = async (rejectedList?: string[]) => {
    if (!pickupCoords) return;

    try {
      const res = await fetch(
        `/api/drivers/nearby?lat=${pickupCoords[0]}&lng=${pickupCoords[1]}`
      );

      const data = await res.json();

      const rejectSet = new Set(rejectedList ?? rejectedDrivers);

      const filtered = data.filter(
        (driver: any) => !rejectSet.has(driver._id)
      );

      setNearbyDrivers(filtered);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
  if (!pickupCoords) return;

  if (rideId) return;

  fetchNearbyDrivers();
}, [pickupCoords, rideId, rejectedDrivers]);

 useEffect(() => {
  const restoreRide =
    async () => {

      if (
        !session?.user?._id
      ) {
        return;
      }

      try {

        const res =
          await fetch(
            `/api/ride/current?userId=${session.user._id}`
          );

        const ride =
          await res.json();

        // NO ACTIVE RIDE
        if (!ride) {
          return;
        }

        // COMPLETED
        if (ride.status === "completed") {
          setTimeout(() => {
            resetRide();
          }, 7000);
          return;
        }

        // REJECTED / SEARCHING
        if (
          ride.status !== "accepted" &&
          ride.status !== "arriving" &&
          ride.status !== "started"
        ) {

          setRideStatus(null);
          setRideId(null);

          // RESTORE PICKUP + DROP
          setPickupCoords([
            ride.pickup.lat,
            ride.pickup.lng,
          ]);

          setPickupAddress(
            ride.pickup.address
          );

          setDropCoords([
            ride.drop.lat,
            ride.drop.lng,
          ]);

          setDropAddress(
            ride.drop.address
          );

          // FETCH OTHER DRIVERS
          const driversRes =
            await fetch(
              `/api/drivers/nearby?lat=${ride.pickup.lat}&lng=${ride.pickup.lng}`
            );

          const driversData =
            await driversRes.json();

          setNearbyDrivers(
            driversData.filter(
              (driver: any) =>
                !rejectedDrivers.includes(driver._id)
            )
          );

          return;
        }

        // ACTIVE RIDE
        setRideId(
          ride._id
        );

        setRideStatus(
          ride.status
        );

        setFare(
          ride.fare
        );

        // PICKUP
        setPickupCoords([
          ride.pickup.lat,
          ride.pickup.lng,
        ]);

        setPickupAddress(
          ride.pickup.address
        );

        // DROP
        setDropCoords([
          ride.drop.lat,
          ride.drop.lng,
        ]);

        setDropAddress(
          ride.drop.address
        );

        // DRIVER
        if (ride.driverId) {

          const driver = {
            _id:
              ride.driverId._id,

            currentLocation:
              ride.driverId.currentLocation,
          };

          setSelectedDriver(ride.driverId);

          setActiveDriver(ride.driverId);
        }

      } catch (error) {
        console.log(error);
      }
    };

  restoreRide();

}, [session, rejectedDrivers]);

  return (
  <div className="h-screen w-full relative overflow-hidden bg-black">

    {/* MAP */}
    <div className="absolute inset-0 z-0 pointer-events-auto">
      <MapView
        pickup={pickupCoords}
        drop={dropCoords}
        route={rideStatus === "completed" ? [] : route}
        drivers={
          rideId && activeDriver
            ? [activeDriver]
            : nearbyDrivers
        }
        rideStatus={rideStatus}
      />
    </div>

    
    <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />

    {/* NAVBAR */}
    <div className="absolute top-0 left-0 right-0 z-40">
      <Navbar />
    </div>

    {/* FLOATING ACTIONS */}
    <div className="absolute right-4 top-24 z-40 flex flex-col gap-3">

      <button className="h-12 w-12 rounded-full bg-white shadow-xl flex items-center justify-center">
        <Navigation className="h-5 w-5" />
      </button>

      <button className="h-12 w-12 rounded-full bg-red-500 text-white shadow-xl flex items-center justify-center">
        <Shield className="h-5 w-5" />
      </button>

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


        {/* OTP */}
        {rideStatus === "arriving" && rideOtp && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.2,
            }}
            className="
              rounded-3xl
              bg-gradient-to-r
              from-yellow-400
              to-orange-400
              p-6
            "
          >

            <p className="font-semibold text-lg">
              Share OTP with Driver
            </p>

            <div className="flex gap-3 mt-5">

              {rideOtp
                .split("")
                .map((digit, index) => (
                  <div
                    key={index}
                    className="
                      h-16
                      w-16
                      rounded-2xl
                      bg-white
                      flex
                      items-center
                      justify-center
                      text-2xl
                      font-bold
                    "
                  >
                    {digit}
                  </div>
                ))}

            </div>

          </motion.div>
        )}
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Book a Ride</h1>
            <p className="text-sm text-gray-500 mt-1">
              Safe rides at your fingertips
            </p>
          </div>

          <div className="h-14 w-14 rounded-2xl bg-black text-white flex items-center justify-center">
            <Car className="h-7 w-7" />
          </div>
        </div>

        {/* LOCATION CARD */}
        {!rideId && (
        <Card className="rounded-3xl border-0 shadow-lg overflow-visible">
          <CardContent className="p-4 space-y-4">

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">
                PICKUP LOCATION
              </p>

              <LocationInput
                placeholder="Enter pickup location"
                onSelect={(place: {
                  lat: number;
                  lng: number;
                  name: string;
                })=> {
                  setPickupCoords([place.lat, place.lng]);
                  setPickupAddress(place.name);
                }}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">
                DROP LOCATION
              </p>

              <LocationInput
                placeholder="Where do you want to go?"
                onSelect={(place: {
                  lat: number;
                  lng: number;
                  name: string;
                })=> {
                  setDropCoords([place.lat, place.lng]);
                  setDropAddress(place.name);
                }}
              />
            </div>

          </CardContent>
        </Card>
      )}

    {/* FIND RIDE */}
    {!rideId && (
      <Button
        className="w-full h-14 rounded-2xl text-base font-semibold shadow-xl"
        onClick={async () => {
          setLoading(true);
          try {
            await handleFindRide();
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Finding Drivers...
          </div>
        ) : (
          "Find Ride"
        )}
      </Button>
    )}

    {/* FARE CARD */}
    <div
      className="
        rounded-3xl
        bg-gradient-to-r
        from-black
        to-gray-800
        text-white
        p-5
      "
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-white/70">
            Estimated Fare
          </p>

          <h2 className="text-3xl font-bold mt-1">
            ₹ {rideStatus === "completed"
              ? "--"
              : fare ?? "--"}
          </h2>

          {distance && (
            <p className="text-sm text-white/70 mt-1">
              {distance.toFixed(1)} km
            </p>
          )}

        </div>

        <Clock3 className="h-10 w-10 text-white/60" />

      </div>

    </div>

    {/* STATUS */}
    <AnimatePresence>

      {rideStatus && (
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 20,
          }}
          className="
            rounded-3xl
            bg-white
            border
            shadow-lg
            p-5
          "
        >

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-gray-500">
                Ride Status
              </p>

              <h2 className="text-xl font-bold mt-1">

                {rideStatus === "accepted" &&
                  "Driver Accepted"}

                {rideStatus === "arriving" &&
                  "Driver Arriving"}

                {rideStatus === "started" &&
                  "Trip Started"}

                {rideStatus === "completed" &&
                  "Trip Completed"}

              </h2>

            </div>

            <div
              className={`
                h-4
                w-4
                rounded-full
                animate-pulse

                ${
                  rideStatus === "completed"
                    ? "bg-green-500"
                    : "bg-yellow-500"
                }
              `}
            />

          </div>

          {/* ETA */}
          {rideId &&
            eta !== null &&
            rideStatus !== "completed" && (
              <div
                className="
                  mt-4
                  rounded-2xl
                  bg-gray-100
                  p-4
                  flex
                  items-center
                  justify-between
                "
              >

                <div>

                  <p className="text-sm text-gray-500">
                    ETA
                  </p>

                  <h3 className="text-lg font-bold">
                    {eta} mins
                  </h3>

                </div>

                <Clock3 className="h-8 w-8 text-gray-500" />

              </div>
            )}

        </motion.div>
      )}

    </AnimatePresence>

    {/* DRIVERS */}
    {!rideId && nearbyDrivers.length > 0 && (
      <div className="space-y-4">

        <div className="flex items-center justify-between">

          <h2 className="text-lg font-bold">
            Nearby Drivers
          </h2>

          <span className="text-sm text-gray-500">
            {nearbyDrivers.length} available
          </span>

        </div>

        {nearbyDrivers
          .filter((driver) => driver?._id)
          .map((driver) => {

            const eta =
              calculateDriverETA(
                [
                  driver.currentLocation.lat,
                  driver.currentLocation.lng,
                ],
                pickupCoords!
              );

            return (
              <motion.div
                key={driver._id}
                whileHover={{
                  scale: 1.01,
                }}
                whileTap={{
                  scale: 0.99,
                }}
                className="
                  rounded-3xl
                  bg-white
                  border
                  shadow-md
                  p-5
                "
              >

                <div
                  className="
                    w-full
                    rounded-3xl
                    border
                    border-white/10
                    bg-white/5
                    backdrop-blur-xl
                    shadow-xl
                    p-5
                    transition
                    hover:scale-[1.01]
                  "
                >

                  {/* TOP SECTION */}
                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-4">

                      {/* DRIVER ICON */}
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-black to-gray-800 text-white flex items-center justify-center shadow-lg">
                        <Car className="h-6 w-6" />
                      </div>

                      {/* DRIVER INFO */}
                      <div className="space-y-1">

                        {/* CAR INFO */}
                        <p className="text-md text-gray-400 flex items-center gap-1">
                          <span className="text-black/60">•</span>
                          {driver.carName}
                          <span className="text-black/40">•</span>
                          {driver.carType}
                        </p>

                        {/* RATING */}
                        <div className="flex items-center gap-2 mt-1">

                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium text-white/90">
                              {driver.ratingAvg?.toFixed(1)}
                            </span>
                          </div>

                          <span className="text-xs text-gray-500">
                            Driver rating
                          </span>

                        </div>

                      </div>  

                      </div>

                    </div>
                  </div>

                  {/* DIVIDER */}
                  <div className="my-4 border-t border-white/10" />

                  <Button
                    className="w-full mt-5 h-12 rounded-2xl"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await handleSelectDriver(driver);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Selecting Driver...
                      </div>
                    ) : (
                      "Choose Driver"
                    )}
                  </Button>

                </motion.div>
              );
          })}

        </div>
      )}


      {/* ACTIVE DRIVER */}
      {rideStatus==="accepted" && rideId && activeDriver && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="
            rounded-3xl
            bg-black
            text-white
            p-6
            shadow-2xl
            border
            border-white/10
            backdrop-blur-xl
          "
        >

          {/* TOP */}
          <div className="flex items-center justify-between">

            {/* LEFT */}
            <div className="flex items-center gap-4">

              {/* DRIVER ICON */}
              <div className="relative">

                <div
                  className="
                    h-16
                    w-16
                    rounded-2xl
                    bg-white/10
                    flex
                    items-center
                    justify-center
                    shadow-lg
                  "
                >
                  <Car className="h-8 w-8 text-white" />
                </div>

                {/* LIVE DOT */}
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse" />

              </div>

              {/* INFO */}
              <div className="space-y-1">

                <h2 className="text-xl font-semibold leading-tight">
                  {activeDriver.userId?.name}
                </h2>

                <p className="text-sm text-white/60">
                  {activeDriver.carName} • {activeDriver.carType}
                </p>

                {/* RATING */}
                <div className="flex items-center gap-2">

                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {activeDriver.ratingAvg?.toFixed(1) }
                    </span>
                  </div>

                  <span className="text-xs text-white/40">
                    verified driver
                  </span>

                </div>

              </div>

            </div>

            {/* CALL BUTTON */}
            <a
              href={`tel:${activeDriver.userId?.phone}`}
              className="
                group
                relative
                h-14
                w-14
                rounded-full
                bg-green-500
                flex
                items-center
                justify-center
                shadow-lg
                hover:scale-105
                transition
              "
            >
              <Phone className="h-6 w-6 text-white" />

              {/* glow */}
              <div className="absolute inset-0 rounded-full bg-green-400 blur-xl opacity-30 group-hover:opacity-50 transition" />
            </a>

          </div>

          {/* BOTTOM STATUS BAR */}
          <div className="mt-5 flex items-center justify-between">

            <p className="text-xs text-white/40">
              Driver is on the way to pickup location
            </p>

            <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
              <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              LIVE
            </div>

          </div>

        </motion.div>
      )}

    </div>
    </div>

  </motion.div>
  <RateDriver
    open={showRating}
    onClose={() => setShowRating(false)}
    rideId={rideId}
    driverId={activeDriver?.driverId?._id || activeDriver?.userId?._id}
    riderId={session?.user?._id}
  />
  </div>
);
}
