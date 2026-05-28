"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

import { signInSchema } from "@/schemas/signInSchema";
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
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    setIsSubmitting(true);

    try {
      const result = await signIn("Credentials", {
        redirect: false,
        identifier: data.identifier,
        password: data.password,
      });

      if (result?.error) {
        toast.error("Login Failed", {
          description: "Incorrect email or password",
        });
        return;
      }

      if (result?.ok) {
        toast.success("Login Successful");

        const sessionRes = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        const session = await sessionRes.json();
        const role = session?.user?.role;

        if (role === "DRIVER") {
          router.replace("/driver/dashboard");
        } else if (role === "RIDER") {
          router.replace("/rider/dashboard");
        }
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    await signIn("google", {
      callbackUrl: "/",
    });
  };
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 px-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader className="space-y-2">
          <h1 className="text-4xl font-extrabold text-center text-black font-serif tracking-tight">
            Welcome to Uber
          </h1>
          <CardTitle className="text-center text-lg">Sign In</CardTitle>
        </CardHeader>

        <CardContent>
          <Button
  type="button"
  className="w-full mt-3 mb-2"
  onClick={handleGoogleLogin}
  disabled={isSubmitting}
>
  Continue with Google
</Button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
            {/* EMAIL / IDENTIFIER */}
            <Controller
              name="identifier"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    {...field}
                  />
                  {fieldState.error && (
                    <p className="text-red-500 text-sm mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* PASSWORD */}
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    {...field}
                  />
                  {fieldState.error && (
                    <p className="text-red-500 text-sm mt-1">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            {/* BUTTON */}
            <Button
              className="w-full"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-sm justify-center">
          Not a member yet?{" "}
          <Link
            href="/sign-up"
            className="ml-1 text-blue-600 hover:text-blue-800 font-medium"
          >
            Sign up
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Page;