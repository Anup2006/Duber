import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";

export async function POST(request:Request) {
    await dbConnect()
    try {
        const {name,email,password,phone,role}=await request.json()
        const existingUserByEmail = await UserModel.findOne({email})
        const existingUserByPhone = await UserModel.findOne({phone})
        const verifyCode=Math.floor(100000+Math.random()*900000).toString()


        if (existingUserByEmail) {
            if (existingUserByEmail.isVerified) {
                return Response.json(
                { success: false, message: "Email already registered" },
                { status: 400 }
                );
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            existingUserByEmail.password = hashedPassword;
            existingUserByEmail.verifyCode = verifyCode;
            existingUserByEmail.verifyCodeExpiry = new Date(
                Date.now() + 60 * 60 * 1000
            );

            await existingUserByEmail.save();

            return Response.json({
                success: true,
                message: "User updated. Verification code sent to email",
            },{status:201});
        }
        if (existingUserByPhone) {
            if (existingUserByPhone.isVerified) {
                return Response.json(
                { success: false, message: "Phone already registered" },
                { status: 400 }
                );
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            existingUserByPhone.password = hashedPassword;
            existingUserByPhone.verifyCode = verifyCode;
            existingUserByPhone.verifyCodeExpiry = new Date(
                Date.now() + 60 * 60 * 1000
            );

            await existingUserByPhone.save();

            return Response.json({
                success: true,
                message: "User updated. Verification code sent to phone",
            },{status:201});
        }
        else{
            const hashedPassword = await bcrypt.hash(password,10)
            const expiryDate = new Date()
            expiryDate.setHours(expiryDate.getHours()+1)

            const newUser = new UserModel({
                name,
                email,
                phone,
                password: hashedPassword,
                verifyCode,
                verifyCodeExpiry:expiryDate,
                isVerified:false,
                role: role,
            })
            await newUser.save()
        }

        //send verification code
        const emailResponse = await sendVerificationEmail(email,name,verifyCode)
        if(!emailResponse.success){
            return Response.json({
                success:false,
                message: emailResponse.message
            },{status:500})
        }

        return Response.json({
            success:true,
            message:"User registered successfully!!"
        },{status:201})
    } catch (error) {
        console.error("Error registering User",error)
        return Response.json({
            success:false,
            message:"Error registering user"
        },{
            status:500
        })
    }
}
