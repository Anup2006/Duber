"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import MapView from "@/components/MapView";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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

      setRides(data);
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

    if (!activeRide) return;

    // 🚨 HARD BLOCK COMPLETED RIDE RESTORE
    if (completedRideId && activeRide._id === completedRideId) return;

    setPickupCoords([activeRide.pickup.lat, activeRide.pickup.lng]);
    setDropCoords([activeRide.drop.lat, activeRide.drop.lng]);
    setRideStatus(activeRide.status);
  }, [rides, completedRideId]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Navbar/>
      <div className="max-w-3xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">
          Driver Dashboard
        </h1>

        <div className="space-y-4">

          {rides.map((ride) => (
            <Card key={ride._id}>

              <CardContent className="p-4 space-y-3">

                <div>
                  <p className="font-medium">
                    Ride Request
                  </p>

                  <p
                    className={`text-sm font-medium ${
                      ride.status === "accepted"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    Status: {ride.status}
                  </p>
                </div>

                <div className="text-sm">
                  <p>
                    Pickup:
                    {" "}
                    {ride.pickup.address}
                  </p>

                  <p>
                    Drop:
                    {" "}
                    {ride.drop.address}
                  </p>
                </div>

                <div className="font-semibold">
                  ₹ {ride.distanceKm.toFixed(2)}
                </div>

                <div className="font-semibold">
                  ₹ {ride.fare}
                </div>

                <div className="flex gap-3">

                  <div className="flex gap-2 flex-wrap">
                    {ride.status === "searching" && (
                      <Button onClick={() => acceptRide(ride)}>
                        Accept
                      </Button>
                    )}

                    {ride.status === "accepted" && (
                      <Button onClick={() => updateRideStatus(ride._id, "arriving")}>
                        Arriving to Pickup
                      </Button>
                    )}

                    {/* {ride.status === "arriving" && (
                      <Button onClick={() => updateRideStatus(ride._id, "started")}>
                        Start Ride
                      </Button>
                    )} */}

                    {ride.status === "arriving" && (
                      <div className="space-y-2">

                        <input
                          type="text"
                          placeholder="Enter Rider OTP"
                          value={enteredOtp}
                          onChange={(e) =>
                            setEnteredOtp(e.target.value)
                          }
                          className="
                            border
                            rounded
                            px-3
                            py-2
                            w-full
                          "
                        />

                        <Button
                          onClick={() =>
                            verifyOtp(
                              ride._id,
                              enteredOtp
                            )
                          }
                        >
                          Verify OTP & Start Ride
                        </Button>

                      </div>
                      )}

                    {ride.status === "started" && (
                      <Button onClick={() => updateRideStatus(ride._id, "completed")}>
                        Complete Ride
                      </Button>
                    )}

                  </div>

                  <Button
                    variant="destructive"
                    onClick={() => rejectRide(ride._id)}
                  >
                    Reject
                  </Button>

                </div>

              </CardContent>

            </Card>
          ))}

        </div>
        <div className="mt-6">
          <MapView
            pickup={pickupCoords}
            drop={dropCoords}
            route={route}
            drivers={
              driverCoords
                ? [
                    {
                      currentLocation: {
                        lat:
                          driverCoords[0],

                        lng:
                          driverCoords[1],
                      },
                    },
                  ]
                : []
            }
            rideStatus={rideStatus}
          />

        </div>
      </div>

    </div>
  );
}
