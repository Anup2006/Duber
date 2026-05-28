import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";

import DriverModel from "@/model/driver";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const {
      userId,
      lat,
      lng,
    } = body;

    const driver =
      await DriverModel.findOneAndUpdate(
        {
          userId,
        },
        {
          currentLocation: {
            lat,
            lng,
          },
        },
        {
          new: true,
        }
      );

    return NextResponse.json({
      success: true,
      driver,
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