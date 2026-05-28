import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RideModel from "@/model/Ride";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { rideId, status } = await req.json();

    if (!rideId || !status) {
      return NextResponse.json(
        { success: false, message: "rideId and status are required" },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      "searching",
      "accepted",
      "arriving",
      "started",
      "completed",
      "rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    // build update
    const updateData: any = { status };

    // OTP generation
    if (status === "arriving") {
      updateData.tripOtp =
        (1000 + Math.floor(Math.random() * 9000)).toString();
    }

    // 1. UPDATE DB FIRST
    const ride = await RideModel.findByIdAndUpdate(
      rideId,
      updateData,
      { new: true }
    );

    if (!ride) {
      return NextResponse.json(
        { success: false, message: "Ride not found" },
        { status: 404 }
      );
    }

    // 2. SOCKET EMIT VIA SOCKET SERVER (same as reject flow)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/emit-ride-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rideId,
          status: ride.status,
          driverId: ride.driverId,
          tripOtp: ride.tripOtp || null,
        }),
      });
    } catch (socketError) {
      console.log("SOCKET EMIT ERROR:", socketError);
    }

    return NextResponse.json({
      success: true,
      ride,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update ride",
      },
      { status: 500 }
    );
  }
}