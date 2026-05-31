import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import DriverModel from "@/model/driver";
import RatingModel from "@/model/Rating";
import RideModel, { RideStatus } from "@/model/Ride";

export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    await dbConnect();

    const { userId } = await context.params;

    const driver = await DriverModel.findOne({ userId });

    if (!driver) {
      return NextResponse.json(
        { success: false, message: "Driver not found" },
        { status: 404 }
      );
    }

    const ratings = await RatingModel.find({
      driverId: driver._id,
    });

    const rides = await RideModel.find({
      driverId: driver._id,
      status: RideStatus.COMPLETED,
    });

    // ================= TOTAL EARNINGS =================
    const totalEarnings = rides.reduce(
      (sum: number, ride: any) =>
        sum + (ride.fare || 0),
      0
    );

    // ================= DAILY EARNINGS (CHART) =================
    const earningsMap = new Map<string, number>();

    rides.forEach((ride: any) => {
      if (!ride.completedAt) return;

      const date = new Date(ride.completedAt)
        .toISOString()
        .split("T")[0];

      earningsMap.set(
        date,
        (earningsMap.get(date) || 0) + (ride.fare || 0)
      );
    });

    const earningsChart = Array.from(earningsMap.entries())
      .map(([date, earnings]) => ({
        date,
        earnings,
      }))
      .sort(
        (a, b) =>
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
      );

    // ================= WEEKLY STATS =================
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 14);

    const lastWeekEnd = startOfWeek;

    let thisWeekEarnings = 0;
    let lastWeekEarnings = 0;

    rides.forEach((ride: any) => {
      if (!ride.completedAt) return;

      const date = new Date(ride.completedAt);

      if (date >= startOfWeek) {
        thisWeekEarnings += ride.fare || 0;
      } else if (date >= lastWeekStart && date < lastWeekEnd) {
        lastWeekEarnings += ride.fare || 0;
      }
    });

    const growthPercent =
      lastWeekEarnings === 0
        ? 100
        : ((thisWeekEarnings - lastWeekEarnings) /
            lastWeekEarnings) *
          100;

    // ================= HOURLY HEATMAP =================
    const hourMap = new Map<number, number>();

    rides.forEach((ride: any) => {
      if (!ride.completedAt) return;

      const hour = new Date(ride.completedAt).getHours();

      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    const hourlyHeatmap = Array.from({ length: 24 }).map(
      (_, hour) => ({
        hour,
        trips: hourMap.get(hour) || 0,
      })
    );

    // ================= PERFORMANCE SCORE =================
    const performanceScore =
      (driver.completedTrips || 0) * 5 +
      (driver.ratingAvg || 5) * 20 -
      (driver.rejectedTrips || 0) * 10;

    // ================= RESPONSE =================
    return NextResponse.json({
      completedTrips: driver.completedTrips || 0,
      cancelledTrips: driver.rejectedTrips || 0,
      totalEarnings,
      averageRating: driver.ratingAvg || 5,
      totalReviews: ratings.length,
      performanceScore,

      earningsChart,

      weeklyStats: {
        thisWeekEarnings,
        lastWeekEarnings,
        growthPercent: Number(growthPercent.toFixed(2)),
      },

      hourlyHeatmap,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}