import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";

import RideModel, { RideStatus } from "@/model/Ride";
import DriverModel from "@/model/driver";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json([]);
    }

    // find driver document
    const driver = await DriverModel.findOne({
      userId,
    });

    if (!driver) {
      return NextResponse.json([]);
    }

    // find rides assigned to this driver
    const rides = await RideModel.find({
      driverId: driver._id,
      status: {
        $ne: RideStatus.COMPLETED,
      },
    }).sort({
      createdAt: -1,
    });

    return NextResponse.json(rides);

  } catch (error) {
    console.log(error);

    return NextResponse.json([], {
      status: 500,
    });
  }
}