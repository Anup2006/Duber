import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";

import RideModel from "@/model/Ride";
import "@/model/driver";

export async function GET(
  req: NextRequest
) {

  try {

    await dbConnect();

    const { searchParams } =
      new URL(req.url);

    const rideId =
      searchParams.get("rideId");

    const ride =
      await RideModel.findById(
        rideId
      ).populate("driverId");

    if (
      !ride ||
      !ride.driverId
    ) {
      return NextResponse.json(
        null
      );
    }

    return NextResponse.json(
      ride.driverId
    );

  } catch (error) {

    console.log(error);

    return NextResponse.json(
      null,
      {
        status: 500,
      }
    );
  }
}