import { NextResponse } from "next/server";

let rides: any[] = [];

export async function POST(req: Request) {
  const body = await req.json();

  const ride = {
    id: Date.now(),
    pickup: body.pickup,
    drop: body.drop,
    status: "searching",
  };

  rides.push(ride);

  return NextResponse.json(ride);
}