"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  Popup,
} from "react-leaflet";
import { useEffect } from "react";
import "@/lib/leafletIcon";
import driverIcon from "@/lib/driverIcon";
import "leaflet/dist/leaflet.css";

function FlyTo({
  drivers,
}: any) {

  const map = useMap();

  useEffect(() => {

    if (
      drivers?.length > 0
    ) {

      const lat =
        drivers[0]
          ?.currentLocation?.lat;

      const lng =
        drivers[0]
          ?.currentLocation?.lng;

      if (
        typeof lat === "number" &&
        typeof lng === "number"
      ) {

        map.panTo(
          [lat, lng],
          {
            animate: true,
          }
        );
      }
    }

  }, [drivers]);

  return null;
}

type Props = {
  pickup?: [number, number];
  drop?: [number, number];
  route?: [number, number][];
  drivers?: any[];
  rideStatus?: string | null;
};

export default function MapInner({ pickup, drop, route,drivers,rideStatus }: Props) {
  const center: [number, number] = [18.5204, 73.8567];

  function FitBounds({ route }: { route?: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (route && route.length > 0) {
      map.fitBounds(route as any, { padding: [50, 50] });
    }
  }, [route]);

  return null;
}
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyTo drivers={drivers} />
      {route &&
      route.length > 0 && (
        <FitBounds route={route} />
      )}
      {pickup && <Marker position={pickup} />}
      {drop && <Marker position={drop} />}
      {drivers?.map((driver, index) => {
        const lat =
          driver?.currentLocation?.lat;

        const lng =
          driver?.currentLocation?.lng;

        if (
          typeof lat !== "number" ||
          typeof lng !== "number"
        ) {
          return null;
        }

        return (
          <Marker
            key={driver._id || index}
            position={[lat, lng]}
            icon={driverIcon}
          >
            <Popup>
              Driver Here
            </Popup>
          </Marker>
        );
      })}
      {route && route.length > 0 && (
        <Polyline
          positions={route}
          pathOptions={{
            color:
              rideStatus === "started"
                ? "blue"
                : "green",

            weight: 5,
          }}
        />
      )}
    </MapContainer>
  );
}

