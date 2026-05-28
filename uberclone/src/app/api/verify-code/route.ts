import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";

export async function POST(request: Request) {
  await dbConnect()

  try {
    const { email, code } = await request.json()

    const user = await UserModel.findOne({ email })

    if (!user) {
      return Response.json({
        success: false,
        message: "User not found"
      }, { status: 404 })
    }

    const isCodeValid = user.verifyCode === String(code)
    const isCodeNotExpired = new Date(user.verifyCodeExpiry!) > new Date()

    if (isCodeValid && isCodeNotExpired) {
      user.isVerified = true
      await user.save()

      return Response.json({
        success: true,
        message: "Account verified successfully"
      }, { status: 200 })
    }

    if (!isCodeNotExpired) {
      return Response.json({
        success: false,
        message: "Verification code expired"
      }, { status: 400 })
    }

    return Response.json({
      success: false,
      message: "Incorrect verification code"
    }, { status: 400 })

  } catch (error) {
    console.error("Error verifying user", error)

    return Response.json({
      success: false,
      message: "Server error"
    }, { status: 500 })
  }
}