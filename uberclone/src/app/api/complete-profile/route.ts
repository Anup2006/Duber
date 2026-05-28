import dbConnect from "@/lib/dbConnect";

import UserModel from "@/model/User";

import { UserRole } from "@/enums/enum";

export async function POST(
  request: Request
) {
  await dbConnect();

  try {
    const {
      email,
      phone,
      role,
    } = await request.json();

    // =====================================
    // VALIDATIONS
    // =====================================

    if (
      !email ||
      !phone ||
      !role
    ) {
      return Response.json(
        {
          success: false,

          message:
            "All fields are required",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================
    // CHECK USER
    // =====================================

    const existingUser =
      await UserModel.findOne({
        email,
      });

    if (!existingUser) {
      return Response.json(
        {
          success: false,

          message:
            "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================
    // CHECK PHONE
    // =====================================

    const existingPhone =
      await UserModel.findOne({
        phone,
      });

    if (
      existingPhone &&
      existingPhone.email !==
        email
    ) {
      return Response.json(
        {
          success: false,

          message:
            "Phone already in use",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================
    // UPDATE PROFILE
    // =====================================

    existingUser.phone =
      phone;

    existingUser.role =
      role as UserRole;

    const updatedUser = await existingUser.save();

    return Response.json(
      {
        success: true,
        message:"Profile completed successfully",
        role: updatedUser.role,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Complete Profile Error:",
      error
    );

    return Response.json(
      {
        success: false,

        message:
          "Error completing profile",
      },
      {
        status: 500,
      }
    );
  }
}