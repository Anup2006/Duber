import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/dbConnect";
import DriverModel from "@/model/driver";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json([]);
    }

    const drivers = await DriverModel.find({
      isAvailable: true,
    });

    const formattedDrivers = drivers.map((driver) => ({
      _id: driver._id,

      carName: driver.carName,

      carType: driver.carType,

      rating: driver.ratingAvg,

      currentLocation: {
        lat: driver.currentLocation?.lat,
        lng: driver.currentLocation?.lng,
      },
    }));

    return NextResponse.json(formattedDrivers);

  } catch (error) {

    console.log(error);

    return NextResponse.json([], {
      status: 500,
    });
  }
}