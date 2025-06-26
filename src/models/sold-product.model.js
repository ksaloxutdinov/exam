import { Schema, model, Types } from "mongoose";

const soldProductSchema = new Schema(
    {
        productId: { 
            type: Types.ObjectId,
            required: [true, 'Product id must be provided'],
        },
        clientId: { 
            type: Types.ObjectId,
            required: [true, 'Client id must be provided'],
        },
        quantity: { 
            type: Number,
            required: [true, 'Product quantity must be provided'],
        },
        totalPrice: { 
            type: Number,
            required: [true, 'Product price must be provided'],
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

soldProductSchema.virtual('product', {
    ref: 'Product',
    localField: 'productId',
    foreignField: '_id'
});

soldProductSchema.virtual('client', {
    ref: 'Client',
    localField: 'clientId',
    foreignField: '_id'
});

const SoldProduct = model('SoldProduct', soldProductSchema);

export default SoldProduct;