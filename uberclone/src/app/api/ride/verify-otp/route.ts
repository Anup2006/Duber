import Ride from "@/model/Ride";
import dbConnect from "@/lib/dbConnect";
import { RideStatus } from "@/model/Ride";

export async function POST(req: Request) {

  await dbConnect();

  try {

    const {
      rideId,
      otp,
    } = await req.json();

    const ride =
      await Ride.findById(
        rideId
      );

    if (!ride) {

      return Response.json({
        success: false,
        message: "Ride not found",
      });

    }

    if (
      ride.tripOtp !== otp
    ) {

      return Response.json({
        success: false,
        message: "Invalid OTP",
      });

    }

    ride.status = RideStatus.STARTED;

    await ride.save();

    const io = (globalThis as any).io;

    if (io) {
      io.to(rideId).emit(
        "ride-status",
        {
          rideId,
          status: "started",
        }
      );
    }

    return Response.json({
      success: true,
    });

  } catch (error) {

    return Response.json({
      success: false,
    });

  }
}