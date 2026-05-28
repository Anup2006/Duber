import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.length < 3) {
      return NextResponse.json([]);
    }

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`,
      {
        headers: {
          "User-Agent": "uber-clone-app",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const text = await res.text();

    if (!text || text.trim().length === 0) {
      return NextResponse.json([]);
    }

    let data = [];

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json([]);
    }

    if (!Array.isArray(data)) {
      return NextResponse.json([]);
    }

    return NextResponse.json(
      data.slice(0, 5).map((item: any) => ({
        name: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
      }))
    );
  } catch (err) {
    return NextResponse.json([]);
  }
}