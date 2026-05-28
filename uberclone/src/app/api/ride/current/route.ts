import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import RideModel, { RideStatus } from "@/model/Ride";

import "@/model/driver";

export async function GET(req: NextRequest) {

  try {

    await dbConnect();

    const userId =
      req.nextUrl.searchParams.get("userId");

    const ride =
      await RideModel.findOne({
        riderId: userId,

        status: {
          $nin: [
            RideStatus.COMPLETED,
            RideStatus.CANCELLED,
          ],
        },
      })
      .populate({
        path: "driverId",
        populate: {
          path: "userId",
          select: "name phone",
        },
      })
      .sort({
        createdAt: -1,
      });

    return NextResponse.json(ride);

  } catch (error) {

    console.log(error);

    return NextResponse.json(null, {
      status: 500,
    });
  }
}