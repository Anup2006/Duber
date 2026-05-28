import { NextResponse } from "next/server";

export async function POST(req: Request) {

  try {

    const { pickup, drop } =
      await req.json();

    // VALIDATION

    if (
      !pickup ||
      !drop ||
      pickup.length !== 2 ||
      drop.length !== 2
    ) {

      return NextResponse.json(
        [],
        { status: 400 }
      );
    }

    // TIMEOUT CONTROLLER

    const controller =
      new AbortController();

    const timeout =
      setTimeout(() => {

        controller.abort();

      }, 25000);

    // const res = await fetch(
    //   "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    //   {
    //     method: "POST",

    //     headers: {
    //       Authorization:
    //         process.env.ORS_API_KEY!,

    //       "Content-Type":
    //         "application/json",
    //     },

    //     body: JSON.stringify({
    //       coordinates: [
    //         [pickup[1], pickup[0]],
    //         [drop[1], drop[0]],
    //       ],
    //     }),

    //     signal:
    //       controller.signal,
    //   }
    // );

    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${pickup[1]},${pickup[0]};${drop[1]},${drop[0]}?overview=full&geometries=geojson`;

    const res = await fetch(url);

    clearTimeout(timeout);

    // FAILED API

    if (!res.ok) {

      console.log(
        "ORS FAILED:",
        res.status
      );

      return NextResponse.json(
        [],
        { status: 500 }
      );
    }

    const data =
      await res.json();

    const coords = data?.routes?.[0]?.geometry?.coordinates;

    if (!coords || !Array.isArray(coords)) {
      console.log("NO COORDS FROM OSRM:", data);
      return NextResponse.json([], { status: 500 });
    }

    return NextResponse.json(coords);

  } catch (error) {

    console.log(
      "ROUTE API ERROR:",
      error
    );

    return NextResponse.json(
      [],
      { status: 500 }
    );
  }
}