import { Schema, model } from "mongoose";

const clientSchema = new Schema(
    {
        username: { 
            type: String,
            unique: [true, 'Username must be unique'],
            required: [true, 'Username must be provided'],
            lowercase: true,
            trim: true
        },
        fullName: {
            type: String,
            required: [true, 'Full name must be provided'],
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
        address: {
            type: String,
            required: [true, 'Address must be provided']
        },
        role: {
            type: String,
            default: 'client'
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
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

clientSchema.virtual('purchasedProducts', {
    ref: 'SoldProduct',
    localField: '_id',
    foreignField: 'clientId'
});

const Client = model('Client', clientSchema);

export default Client;