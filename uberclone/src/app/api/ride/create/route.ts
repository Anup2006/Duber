import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";

import RideModel, {
  RideStatus,
} from "@/model/Ride";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();

    const ride = await RideModel.create({
      riderId: body.riderId,

      driverId: body.driverId,

      pickup: body.pickup,

      drop: body.drop,

      distanceKm: body.distanceKm,

      fare: body.fare,

      status: RideStatus.SEARCHING,

      requestedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      ride,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create ride",
      },
      {
        status: 500,
      }
    );
  }
}