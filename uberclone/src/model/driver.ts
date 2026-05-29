import mongoose, { Schema, Document } from "mongoose";

export interface Driver extends Document {
  userId: mongoose.Types.ObjectId;

  carName: string;

  carNumber: string;

  carType: string;

  ratingAvg: number;
  ratingCount: number;
  ratingSum: number;
  totalTrips: number;

  licenseNumber: string;

  isAvailable: boolean;

  currentLocation: {
    lat: number;
    lng: number;
  };
}

const DriverSchema: Schema<Driver> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    carName: {
      type: String,
      required: true,
    },

    carNumber: {
      type: String,
      required: true,
      unique: true,
    },

    carType: {
      type: String,
      required: true,
    },

    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },

    ratingAvg: {
      type: Number,
      default: 5,
    },

    ratingCount: {
      type: Number,
      default: 0,
    },

    ratingSum: {
      type: Number,
      default: 0,
    },

    totalTrips: {
      type: Number,
      default: 0,
    },

    isAvailable: {
      type: Boolean,
      default: false,
    },

    currentLocation: {
      lat: {
        type: Number,
        default: 0,
      },

      lng: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

const DriverModel =
  (mongoose.models.Driver as mongoose.Model<Driver>) ||
  mongoose.model<Driver>("Driver", DriverSchema);

export default DriverModel;