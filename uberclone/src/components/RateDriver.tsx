"use client";

import { useState } from "react";
import { Star,X} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RateDriver({
  open,
  onClose,
  rideId,
  driverId,
  riderId,
}: any) {
  const [rating, setRating] = useState(0);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submitRating = async () => {
    setLoading(true);

    const res = await fetch("/api/rating", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        rideId,
        driverId,
        riderId,
        rating,
        }),
    });

    const data = await res.json();

    setLoading(false);

    if (data.success) {
        setSuccess(true);

        setTimeout(() => {
        handleClose();
        }, 1200);
    }
    };
  
  const handleClose = () => {
    setRating(0);
    setSuccess(false);
    onClose();
    };
    console.log("sd",rideId,
  driverId,
  riderId)
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <button
            onClick={handleClose}
            className="
            absolute
            top-4
            right-4
            h-9
            w-9
            rounded-full
            bg-gray-100
            flex
            items-center
            justify-center
            hover:bg-gray-200
            transition
            "
        >
            <X className="h-5 w-5" />
        </button>   
      <div className="bg-white text-black p-6 rounded-3xl w-[90%] max-w-sm">
        {success ? (
            <div className="text-center py-6">

            <h2 className="text-2xl font-bold">
                Thank You ⭐
            </h2>

            <p className="text-gray-500 mt-2">
                Rating submitted successfully
            </p>

            </div>
        ) : (
            <>
                <h2 className="font-bold text-lg mb-4">
                Rate your driver
                </h2>

                <div className="flex gap-2 mb-6">
                {[1,2,3,4,5].map((num) => (
                    <Star
                    key={num}
                    onClick={() => setRating(num)}
                    className={`cursor-pointer ${
                        num <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                    />
                ))}
                </div>

                <Button
                className="w-full"
                disabled={loading || rating === 0}
                onClick={submitRating}
                >
                {loading ? "Submitting..." : "Submit Rating"}
                </Button>
            </>    
        )}
      </div>
    </div>
  );
}