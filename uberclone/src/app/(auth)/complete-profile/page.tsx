"use client";

import { useState } from "react";

import {
  useForm,
  Controller,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import * as z from "zod";

import axios, {
  AxiosError,
} from "axios";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import {
  useSession,
} from "next-auth/react";

import {
  UserRole,
} from "@/enums/enum";

import {
  ApiResponse,
} from "@/types/ApiResponse";

import {
  Input,
} from "@/components/ui/input";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import * as zod from "zod";

// =====================================
// SCHEMA
// =====================================

const completeProfileSchema =
  zod.object({
    phone:
      zod.string().min(10),

    role:
      zod.nativeEnum(
        UserRole
      ),
  });

const Page = () => {
  const router =
    useRouter();

  const {
    data: session,
  } = useSession();

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const form = useForm<
    z.infer<
      typeof completeProfileSchema
    >
  >({
    resolver:
      zodResolver(
        completeProfileSchema
      ),

    defaultValues: {
      phone: "",

      role:
        UserRole.RIDER,
    },
  });

  // =====================================
  // SUBMIT
  // =====================================

  const onSubmit =
    async (
      data: z.infer<
        typeof completeProfileSchema
      >
    ) => {
      setIsSubmitting(
        true
      );

      try {
        const response = await axios.post("/api/complete-profile", {
          email: session?.user?.email,
          phone: data.phone,
          role: data.role,
        });

        toast.success("Profile Completed");

        // 🔥 refresh NextAuth session
        await fetch("/api/auth/session", { cache: "no-store" });

        const sessionRes = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        const sessionData = await sessionRes.json();
        const role = sessionData?.user?.role;

        if (role === "DRIVER") {
          router.replace("/driver/setup");
        } else {
          router.replace("/rider/dashboard");
        }

      } catch (error) {
        const axiosError =
          error as AxiosError<ApiResponse>;

        toast.error(
          "Failed",
          {
            description:
              axiosError
                .response
                ?.data
                .message,
          }
        );
      } finally {
        setIsSubmitting(
          false
        );
      }
    };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-4xl font-extrabold text-center text-black font-serif tracking-tight">
            Complete Profile
          </h1>

          <CardTitle>
            Add Remaining Details
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={form.handleSubmit(
              onSubmit
            )}
            className="space-y-4"
          >
            {/* PHONE */}

            <Controller
              name="phone"
              control={
                form.control
              }
              render={({
                field,
                fieldState,
              }) => (
                <div>
                  <Input
                    placeholder="Phone"
                    {...field}
                  />

                  <p className="text-red-500 text-sm">
                    {
                      fieldState
                        .error
                        ?.message
                    }
                  </p>
                </div>
              )}
            />

            {/* ROLE */}

            <Controller
              name="role"
              control={
                form.control
              }
              render={({
                field,
              }) => (
                <select
                  {...field}
                  className="w-full p-2 border rounded-md bg-white text-black"
                >
                  <option
                    value={
                      UserRole.RIDER
                    }
                  >
                    Rider
                  </option>

                  <option
                    value={
                      UserRole.DRIVER
                    }
                  >
                    Driver
                  </option>
                </select>
              )}
            />

            {/* BUTTON */}

            <Button
              type="submit"
              className="w-full"
              disabled={
                isSubmitting
              }
            >
              {isSubmitting
                ? "Saving..."
                : "Complete Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;