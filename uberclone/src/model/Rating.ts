import mongoose, { Schema, Document } from "mongoose";

export interface Rating extends Document {
  rideId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  riderId: mongoose.Types.ObjectId;

  rating: number;
  comment?: string;
}

const RatingSchema = new Schema<Rating>(
  {
    rideId: {
      type: Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      unique: true, // 👈 prevents duplicate rating per ride
    },

    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    riderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Rating ||
  mongoose.model<Rating>("Rating", RatingSchema);