import mongoose, { Schema, Document } from "mongoose";

export enum RideStatus {
  SEARCHING = "searching",
  ACCEPTED = "accepted",
  ARRIVING = "arriving",
  STARTED = "started",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Ride extends Document {
  riderId: mongoose.Types.ObjectId;

  driverId?: mongoose.Types.ObjectId;

  pickup: Location;

  drop: Location;

  distanceKm: number;

  fare: number;

  status: RideStatus;

  requestedAt: Date;

  tripOtp: String;
  
  acceptedAt?: Date;

  startedAt?: Date;

  completedAt?: Date;
}

const LocationSchema = new Schema<Location>(
  {
    lat: {
      type: Number,
      required: true,
    },

    lng: {
      type: Number,
      required: true,
    },

    address: {
      type: String,
    },
  },
  { _id: false }
);

const RideSchema: Schema<Ride> = new Schema(
  {
    riderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
    },

    pickup: {
      type: LocationSchema,
      required: true,
    },

    drop: {
      type: LocationSchema,
      required: true,
    },

    distanceKm: {
      type: Number,
      required: true,
    },

    fare: {
      type: Number,
      required: true,
    },

    tripOtp: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: Object.values(RideStatus),
      default: RideStatus.SEARCHING,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    acceptedAt: {
      type: Date,
    },

    startedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const RideModel =
  (mongoose.models.Ride as mongoose.Model<Ride>) ||
  mongoose.model<Ride>("Ride", RideSchema);

export default RideModel;