import { Schema, model } from "mongoose";

const adminSchema = new Schema(
    {
        username: { 
            type: String,
            unique: [true, 'Username must be unique'],
            required: [true, 'Username must be provided'],
            lowercase: true,
            trim: true
        },
        email: { 
            type: String,
            unique: [true, 'Email address must be unique'],
            required: [true, 'Email address must be provided'],
            lowercase: true,
            trim: true
        },
        phone: { 
            type: String,
            unique: [true, 'Phone number must be unique'],
            required: [true, 'Phone number must be provided'],
            trim: true
        },
        role: {
            type: String,
            trim: true,
            lowercase: true,
            enum: ['superadmin', 'admin'],
            default: 'admin'
        },
        verified: {
            type: Boolean,
            default: false
        },
        hashedPassword: {
            type: String,
            required: [true, 'Passwrod must be provided'],
            select: false
        }
    },
    {
        timestamps: true
    }
);

const Admin = model('Admin', adminSchema);

export default Admin;