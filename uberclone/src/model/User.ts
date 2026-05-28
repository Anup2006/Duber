import mongoose, { Schema, Document } from "mongoose";
import { UserRole } from "@/enums/enum";

export interface User extends Document {
  name: string;
  email: string;

  phone?: string;

  password?: string;

  image?: string;

  providers?: string[];

  verifyCode?: string;

  verifyCodeExpiry?: Date;

  isVerified: boolean;

  role: UserRole;
}

const UserSchema: Schema<User> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [20, "Name cannot exceed 20 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, "Please use valid email"],
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
    },

    providers: {
      type: [String],
      default: ["credentials"],
    },

    verifyCode: {
      type: String,
    },

    verifyCodeExpiry: {
      type: Date,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
    },
  },
  {
    timestamps: true,
  }
);

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export default UserModel;