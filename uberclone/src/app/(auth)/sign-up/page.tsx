"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { signUpSchema } from "@/schemas/signUpSchema";
import { UserRole } from "@/enums/enum";
import { ApiResponse } from "@/types/ApiResponse";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

const Page = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: UserRole.RIDER,
    },
  });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);

    try {
      const response = await axios.post<ApiResponse>("/api/sign-up", data);

      toast.success("Success", {
        description: response.data.message,
      });

      router.replace(`/verify?email=${data.email}`)
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;

      toast.error("Signup Failed", {
        description: axiosError.response?.data.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignup =
    async () => {
      await signIn("google", {
        callbackUrl:
          "/complete-profile",
      });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-4xl font-extrabold text-center text-black font-serif tracking-tight">
            Welcome to Uber
          </h1>
          <CardTitle>Create Account</CardTitle>
        </CardHeader>

        <CardContent>
          <Button
            type="button"
            className="w-full mt-3 mb-2"
            onClick={
              handleGoogleSignup
            }
          >
            Sign Up with Google
          </Button>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* NAME */}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <Input placeholder="Name" {...field} />
                  <p className="text-red-500 text-sm">
                    {fieldState.error?.message}
                  </p>
                </div>
              )}
            />

            {/* EMAIL */}
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <Input placeholder="Email" {...field} />
                  <p className="text-red-500 text-sm">
                    {fieldState.error?.message}
                  </p>
                </div>
              )}
            />

            {/* PHONE */}
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <Input placeholder="Phone" {...field} />
                  <p className="text-red-500 text-sm">
                    {fieldState.error?.message}
                  </p>
                </div>
              )}
            />

            {/* PASSWORD */}
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <Input type="password" placeholder="Password" {...field} />
                  <p className="text-red-500 text-sm">
                    {fieldState.error?.message}
                  </p>
                </div>
              )}
            />

            {/* ROLE SELECT */}
            <Controller
              name="role"
              control={form.control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full p-2 border rounded-md bg-white text-black"
                >
                  <option value={UserRole.RIDER}>Rider</option>
                  <option value={UserRole.DRIVER}>Driver</option>
                </select>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Account"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-sm justify-center">
          Already have an account?
          <Link href="/sign-in" className="ml-1 text-blue-500">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Page;