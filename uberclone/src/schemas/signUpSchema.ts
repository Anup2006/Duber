import { UserRole } from '@/enums/enum';
import {z} from 'zod';

export const nameValidation =z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    
export const signUpSchema= z.object({
    name:nameValidation,
    email: z.string().email({message:"Invalid email address"}),
    phone:z.string(),
    password: z.string().min(6, {message:"Password must be at least 6 characters"}),
    role: z.nativeEnum(UserRole).default(UserRole.RIDER)
})