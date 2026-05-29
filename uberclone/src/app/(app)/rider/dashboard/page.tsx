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
import DriverCard from "@/components/DriverCard";
import { Socket } from "socket.io-client";
import { useRef } from "react";

export default function RiderDashboard() {
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
        setFare(null);
        setNearbyDrivers([]);
        setActiveDriver(null);
        setEta(null);
        setRoute([]);
        setDriverCoords(undefined);
        setPickupCoords(undefined);
        joinedRideRef.current = null;
        setDropCoords(undefined);

        setTimeout(() => {
          resetRide();
        }, 1500);

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
          resetRide();
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Navbar/>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* LEFT PANEL */}
        <Card className="md:col-span-1">
          <CardContent className="p-4 space-y-4">
            <h1 className="text-xl font-semibold">Book a Ride</h1>

            <LocationInput
              placeholder="Pickup location"
              onSelect={(place: {
                lat: number;
                lng: number;
                name: string;
              }) => {

                setPickupCoords([
                  place.lat,
                  place.lng,
                ]);

                setPickupAddress(
                  place.name
                );
              }}
            />

            <LocationInput
              placeholder="Drop location"
              onSelect={(place: {
                lat: number;
                lng: number;
                name: string;
              }) => {
                setDropCoords([
                  place.lat,
                  place.lng,
                ]);

                setDropAddress(
                  place.name
                );
              }}
            />

            <Button
              className="w-full"
              onClick={handleFindRide}
              disabled={loading}
            >
              {loading ? "Booking..." : "Find Ride"}
            </Button>
            <div className="text-sm text-gray-500">
              Estimated fare: ₹{" "}
              {rideStatus === "completed" ? "--" : fare ?? "--"}
            </div>
            
            {rideStatus && (
              <div
                className={`
                  p-3
                  rounded-lg
                  text-sm
                  font-semibold
                  text-white

                  ${
                    rideStatus === "accepted"
                      ? "bg-yellow-500"
                      : rideStatus === "arriving"
                      ? "bg-blue-500"
                      : rideStatus === "started"
                      ? "bg-gray-700"
                      : rideStatus === "completed"
                      ? "bg-green-600" :"bg-red-500"
                  }
                `}
              >

                {rideStatus ===
                  "accepted" &&
                  "Driver Accepted Ride"}

                {rideStatus ===
                  "arriving" &&
                  "Driver Arriving"}

                {rideStatus ===
                  "started" &&
                  "Trip Started"}

                {rideStatus ===
                  "completed" &&
                  "Trip Completed"}

              </div>
            )}

            {rideId && eta !== null && rideStatus && (
              <div className="text-sm text-gray-600">

                <span className="font-semibold">
                  {rideStatus === "accepted" &&
                    `Driver arriving in ${eta} mins`}

                  {rideStatus === "arriving" &&
                    `Driver reaching pickup in ${eta} mins`}

                  {rideStatus === "started" &&
                    `Destination ETA ${eta} mins`}
                </span>

              </div>
            )}

            {!rideId && nearbyDrivers.length > 0 && (
              <div className="space-y-3 mt-4">

                <h2 className="text-sm font-medium">
                  Available Drivers
                </h2>

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
                      <DriverCard
                        key={driver._id}

                        driver={{
                          ...driver,
                          eta,
                        }}

                        onSelect={() =>
                          handleSelectDriver(driver)
                        }
                      />
                    );
                })}

              </div>
            )}

            {rideStatus === "arriving" && rideOtp && (
              <div className="p-4 rounded-lg bg-yellow-100">
                <p className="text-sm text-gray-600">
                  Share OTP with driver
                </p>
                <div className="text-3xl font-bold tracking-widest">
                  {rideOtp}
                </div>
              </div>
            )}

            {rideId && activeDriver && (
              <div className="space-y-4 mt-4 p-4 rounded-xl border bg-white">

                <h2 className="text-sm font-semibold">
                  Driver Details
                </h2>

                <div className="space-y-2">

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Driver
                    </span>

                    <span className="font-medium">
                      {activeDriver.userId?.name}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Vehicle
                    </span>

                    <span className="font-medium">
                      {activeDriver.carName} • {activeDriver.carType}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Rating
                    </span>

                    <span className="font-medium">
                      ⭐ {activeDriver.rating || 5}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">
                      Phone 
                    </span>

                    <a
                      href={`tel:${activeDriver.userId?.phone}`}
                      className="
                        bg-black
                        text-white
                        px-4
                        py-2
                        rounded-lg
                        text-sm
                      "
                    >
                      {activeDriver.userId?.phone}
                      <br />
                      Call Driver
                    </a>
                  </div>

                </div>

              </div>
            )}

          </CardContent>
        </Card>

        {/* MAP */}
        <Card className="md:col-span-2">
          <CardContent className="p-0">
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
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
