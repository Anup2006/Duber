import {
  NextResponse,
} from "next/server";

import dbConnect
from "@/lib/dbConnect";

import DriverModel
from "@/model/driver";

export async function POST(
  req: Request
) {
  try {

    await dbConnect();

    const body =
      await req.json();

    const existing =
      await DriverModel.findOne({
        userId:
          body.userId,
      });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Driver already exists",
        }
      );
    }

    const driver =
      await DriverModel.create(
        body
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