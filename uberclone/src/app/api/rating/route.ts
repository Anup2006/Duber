import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RatingModel from "@/model/Rating";
import DriverModel from "@/model/driver";

export async function POST(req: Request) {
  await dbConnect();

  try {
    const body = await req.json();

    const { rideId, driverId, riderId, rating, comment } = body;

    console.log({
  rideId,
  driverId,
  riderId,
  rating,
});
    
    if (!rideId || !driverId || !riderId || !rating) {
      console.log("MISSING FIELD", {
    rideId,
    driverId,
    riderId,
    rating,
  });
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }
    

    // 1. prevent duplicate rating
    const existing = await RatingModel.findOne({ rideId });

    if (existing) {
      return NextResponse.json(
        { error: "Already rated this ride" },
        { status: 400 }
      );
    }

    // 2. save rating
    await RatingModel.create({
      rideId,
      driverId,
      riderId,
      rating,
      comment,
    });

    // 3. update driver stats
    const driver = await DriverModel.findOne({
        userId: driverId,
    });

    if (!driver) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      );
    }

    driver.ratingSum += rating;
    driver.ratingCount += 1;
    driver.ratingAvg = Number(
        (
            driver.ratingSum /
            driver.ratingCount
        ).toFixed(1)
    );

    driver.totalTrips += 1;

    await driver.save();

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
