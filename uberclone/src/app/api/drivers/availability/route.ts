import { NextRequest, NextResponse } from "next/server";

import DriverModel from "@/model/driver";

export async function PATCH(req: NextRequest) {

  try {

    const { userId, isAvailable } =
      await req.json();

    const driver =
      await DriverModel.findOneAndUpdate(
        { userId },

        {
          isAvailable,
        },

        {
          new: true,
        }
      );

    return NextResponse.json(driver);

  } catch (error) {

    return NextResponse.json(
      {
        message: "Error",
      },

      {
        status: 500,
      }
    );

  }

}