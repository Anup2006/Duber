"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useSession,
} from "next-auth/react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Input,
} from "@/components/ui/input";

import {
  Button,
} from "@/components/ui/button";
import Navbar from "@/components/Navbar";

export default function DriverSetupPage() {

  const router =useRouter();
  const {data: session,} = useSession();
  const [loading,setLoading] =useState(false);
  const [location, setLocation] =
    useState<{
        lat: number;
        lng: number;
    } | null>(null);
  const [form,setForm] =useState({
    carName: "",
    carNumber: "",
    carType: "",
    licenseNumber: "",
    });

    const handleGetLocation =
        () => {

        navigator.geolocation.getCurrentPosition(

            (position) => {

            setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            });

            },

            (error) => {
            console.log(error);

            alert(
                "Location permission denied"
            );
            }

        );
    };
  
    const handleSubmit =
    async () => {

    try {

      setLoading(true);

      const res =
        await fetch(
          "/api/drivers/create",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
              userId:
                session?.user?._id,
              ...form,
              currentLocation: location,
              isAvailable: false,
            }),
          }
        );

      const data =
        await res.json();

      console.log(data);

      router.push(
        "/driver/dashboard"
      );

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Navbar/>
      <Card className="w-full max-w-md">

        <CardContent className="p-6 space-y-4">

          <h1 className="text-2xl font-bold">
            Driver Setup
          </h1>

          <Input
            placeholder="Car Name"
            value={form.carName}
            onChange={(e) =>
              setForm({
                ...form,
                carName:
                  e.target.value,
              })
            }
          />

          <Input
            placeholder="Car Number"
            value={form.carNumber}
            onChange={(e) =>
              setForm({
                ...form,
                carNumber:
                  e.target.value,
              })
            }
          />

          <Input
            placeholder="Car Type"
            value={form.carType}
            onChange={(e) =>
              setForm({
                ...form,
                carType:
                  e.target.value,
              })
            }
          />

          <Input
            placeholder="License Number"
            value={
              form.licenseNumber
            }
            onChange={(e) =>
              setForm({
                ...form,
                licenseNumber:
                  e.target.value,
              })
            }
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGetLocation}
            >
                Use Current Location
            </Button>
            {location && (
                <div className="text-sm text-gray-500">

                    Lat:
                    {" "}
                    {location.lat}

                    <br />

                    Lng:
                    {" "}
                    {location.lng}

                </div>

            )}

          <Button
            className="w-full"
            onClick={
              handleSubmit
            }
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : "Complete Setup"}
          </Button>

        </CardContent>

      </Card>

    </div>
  );
}