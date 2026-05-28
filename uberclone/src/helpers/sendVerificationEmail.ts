import nodemailer from "nodemailer";

import VerificationEmail from "../../emails/VerificationEmail";

import { render } from "@react-email/render";

import { ApiResponse } from "@/types/ApiResponse";

export async function sendVerificationEmail(
  email: string,
  name: string,
  verifyCode: string
): Promise<ApiResponse> {

  try {

    const transporter =
      nodemailer.createTransport({

        service: "gmail",

        auth: {
          user: process.env.EMAIL_USER,

          pass: process.env.EMAIL_PASS,
        },
      });

    const html = await render(
      VerificationEmail({
        name,
        otp: verifyCode,
      })
    );

    const response =
      await transporter.sendMail({

        from: process.env.EMAIL_USER,

        to: email,

        subject: "Uber | Verification Code",

        html,
      });

    console.log(
      "NODEMAILER RESPONSE:",
      response
    );

    return {
      success: true,

      message:
        "Verification email sent successfully",
    };

  } catch (emailErr) {

    console.error(
      "Error sending verification email",
      emailErr
    );

    return {
      success: false,

      message:
        "Failed to send verification email",
    };
  }
}