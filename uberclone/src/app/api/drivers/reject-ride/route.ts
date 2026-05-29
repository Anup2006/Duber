import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RideModel, { RideStatus } from "@/model/Ride";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { rideId } = await req.json();

    if (!rideId) {
      return NextResponse.json(
        { success: false, message: "rideId is required" },
        { status: 400 }
      );
    }

    // 1. Find existing ride
    const existingRide = await RideModel.findById(rideId);

    if (!existingRide) {
      return NextResponse.json(
        { success: false, message: "Ride not found" },
        { status: 404 }
      );
    }

    // 2. Update DB
    const ride = await RideModel.findByIdAndUpdate(
      rideId,
      {
        status: RideStatus.SEARCHING,
        $unset: { driverId: "" },
      },
      { new: true }
    );

    // 3. Emit via SOCKET SERVER (NOT globalThis)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/emit-ride-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rideId,
          status: "rejected",
          driverId: existingRide.driverId,
        }),
      });
    } catch (socketError) {
      console.log("SOCKET EMIT ERROR:", socketError);
      // don't fail request if socket fails
    }

    return NextResponse.json({
      success: true,
      message: "Ride rejected successfully",
      ride,
    });
  } catch (error) {
    console.log("REJECT RIDE ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}