"use client";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
});

type Props = {
  pickup?: [number, number];
  drop?: [number, number];
  route?: [number, number][];
  drivers?: any[];
  rideStatus?: string | null;
};

export default function MapView({ pickup, drop, route,drivers,rideStatus}: Props) {
  return (
    <MapInner
      pickup={pickup}
      drop={drop}
      route={route}
      drivers={drivers}
      rideStatus={rideStatus}
    />
    
  );
}
