import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";

import RideModel, {
  RideStatus,
} from "@/model/Ride";

export async function POST(
  req: Request
) {
  try {
    await dbConnect();

    const { rideId } =
      await req.json();

    const ride =
      await RideModel.findById(
        rideId
      );

    if (!ride) {
      return NextResponse.json(
        {
          success: false,
          message: "Ride not found",
        },
        {
          status: 404,
        }
      );
    }

    ride.status =
      RideStatus.ACCEPTED;

    ride.acceptedAt =
      new Date();

    await ride.save();

    return NextResponse.json({
      success: true,
      ride,
    });

  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}