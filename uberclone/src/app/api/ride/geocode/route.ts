import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { address } = await req.json();

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
    {
      headers: {
        "User-Agent": "uber-clone-app",
      },
    }
  );

  const text = await res.text();

  if (!text || text.includes("Access")) {
    return NextResponse.json(
      { error: "Blocked by OSM API" },
      { status: 500 }
    );
  }

  const data = JSON.parse(text);

  if (!data?.length) {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
  });
}