'use client'

import { Suspense, useState } from "react"
import { verifySchema } from "@/schemas/verifySchema"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios, { AxiosError } from "axios"
import { ApiResponse } from "@/types/ApiResponse"

function VerifyAccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      verifyCode: ""
    }
  })

  const onSubmit = async (data: z.infer<typeof verifySchema>) => {
    setIsSubmitting(true)

    try {
      const response = await axios.post<ApiResponse>("/api/verify-code", {
        email: email,
        code: data.verifyCode
      })

      toast.success("Success", {
        description: response.data.message
      })

      router.replace("/sign-in")

    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>

      toast.error("Verification Failed", {
        description: axiosError.response?.data.message || "Something went wrong"
      })

    } finally {
      setIsSubmitting(false)
    }
  }

  if (!email) {
    return <div className="text-center mt-10">Invalid verification link</div>
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md">

        <h1 className="text-2xl font-bold text-center">
          Verify Your Account
        </h1>

        <p className="text-center text-sm text-gray-500">
          Enter the verification code sent to{" "}
          <span className="font-medium">{email}</span>
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          <input
            type="text"
            placeholder="Enter verification code"
            {...form.register("verifyCode")}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {isSubmitting ? "Verifying..." : "Verify Account"}
          </button>

        </form>
      </div>
    </div>
  )
}

export default function VerifyAccount() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyAccountContent />
    </Suspense>
  )
}