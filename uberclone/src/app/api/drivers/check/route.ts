import {
  NextResponse,
} from "next/server";

import dbConnect
from "@/lib/dbConnect";

import DriverModel
from "@/model/driver";

export async function GET(
  req: Request
) {
  try {

    await dbConnect();

    const {
      searchParams,
    } = new URL(req.url);

    const userId =
      searchParams.get(
        "userId"
      );

    if (!userId) {
      return NextResponse.json({
        exists: false,
      });
    }

    const driver =
      await DriverModel.findOne({
        userId,
      });

    return NextResponse.json({
      exists: !!driver,
    });

  } catch (error) {

    console.log(error);

    return NextResponse.json({
      exists: false,
    });
  }
}