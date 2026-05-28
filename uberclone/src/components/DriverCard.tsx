"use client";

import { Button } from "@/components/ui/button";

type Props = {
  driver: {
    id: string;
    carName: string;
    carNumber:string;
    rating: number;
    eta: number;
  };

  onSelect: () => void;
};

export default function DriverCard({
  driver,
  onSelect,
}: Props) {
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <h3 className="font-semibold text-lg">
            {driver.carName}
          </h3>
          <h3 className="font-semibold text-lg">
            {driver.carNumber}
          </h3>

          <p className="text-sm text-gray-500">
            Uber Go
          </p>
        </div>

        <div className="text-right">
          <p className="font-medium">
            ⭐ {driver.rating}
          </p>

          <p className="text-sm text-gray-500">
            {driver.eta} min away
          </p>
        </div>

      </div>

      <Button
        className="w-full mt-4"
        onClick={onSelect}
      >
        Select Driver
      </Button>

    </div>
  );
}