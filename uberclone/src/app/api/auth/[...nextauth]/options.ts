import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { UserRole } from "@/enums/enum";

export const authOptions:NextAuthOptions = {
    providers:[
        // GOOGLE LOGIN
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        // EMAIL/PASSWORD LOGIN        
        CredentialsProvider({
            id: "Credentials",
            name: "Credentials",
            credentials: {
                identifier: { label: "email", type: "text"},
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials:any):Promise<any> {
                await dbConnect()

                try {
                    const user= await UserModel.findOne({
                        email:credentials.identifier
                    }) 
                    console.log("CREDENTIALS:", credentials);
                    console.log("USER FOUND:", user);
                    if(!user){
                        return null
                    }                   
                    if(!user.isVerified){
                        return null
                    }                   
                    if (!user.password) {
                        throw new Error(
                            "Please login using Google"
                        );
                    }

                    const isPasswordCorrect =await bcrypt.compare(credentials.password,user.password);
                    if(isPasswordCorrect){
                        return user
                    }else{
                        return null
                    }
                } catch (error:any) {
                    return null
                }
            }
        })
    ],
    callbacks:{
        async jwt({ token }) {
          await dbConnect();

          if (!token?.email) return token;

          const dbUser = await UserModel.findOne({
            email: token.email,
          });

          if (dbUser) {
            token._id = dbUser._id.toString();
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.role = dbUser.role;
            token.isVerified = dbUser.isVerified;
            token.providers = dbUser.providers;
          }

          return token;
        },
        async session({ session, token }) {
            if(token){
                session.user._id=token._id;
                session.user.isVerified=token.isVerified;
                session.user.name=token.name;
                session.user.role = token.role as any;
                session.user.providers =token.providers as string[];
            }
            
            return session
        },
        async signIn({
  user,
  account,
}) {
  if (
    account?.provider ===
    "google"
  ) {
    await dbConnect();

    if (!user.email) {
      return false;
    }

    let existingUser =
      await UserModel.findOne({
        email: user.email,
      });

    // =====================================
    // USER DOES NOT EXIST
    // CREATE ACCOUNT
    // =====================================

    if (!existingUser) {
      existingUser =
        await UserModel.create({
          name: user.name,

          email: user.email,

          providers: [
            "google",
          ],

          isVerified: true,

          phone: "",

          role: UserRole.RIDER
        });

      return true;
    }

    // =====================================
    // ADD GOOGLE PROVIDER
    // =====================================

    const providers =
      existingUser.providers ||
      [];

    if (
      !providers.includes(
        "google"
      )
    ) {
      existingUser.providers =
        [
          ...providers,
          "google",
        ];

      await existingUser.save();
    }

    return true;
  }

  return true;
}
    },
    pages:{
        signIn:'/sign-in'
    },
    session:{
        strategy:"jwt"
    },
    secret: process.env.NEXTAUTH_SECRET,
}
