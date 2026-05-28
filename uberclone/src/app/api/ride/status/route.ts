import { NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";

import RideModel from "@/model/Ride";

export async function GET(
  req: Request
) {
  try {
    await dbConnect();

    const { searchParams } =
      new URL(req.url);

    const rideId =
      searchParams.get("rideId");

    if (!rideId) {
      return NextResponse.json(
        {
          success: false,
        },
        {
          status: 400,
        }
      );
    }

    const ride =
      await RideModel.findById(
        rideId
      );

    if (!ride) {
      return NextResponse.json(
        {
          success: false,
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,

      status: ride.status,
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