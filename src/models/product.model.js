import { Schema, model, Types } from "mongoose";

const productSchema = new Schema(
    {
        name: { 
            type: String,
            unique: [true, 'Product name must be unique'],
            required: [true, 'Product name must be provided'],
            trim: true
        },
        description: {
            type: String,
            required: [true, 'Product description must be provided'],
            trim: true
        },
        price: { 
            type: Number,
            required: [true, 'Product price must be provided'],
        },
        quantity: { 
            type: Number,
            required: [true, 'Product quantity must be provided'],
        },
        color: {
            type: String,
            required: [true, 'Product color must be provided'],
            trim: true
        },
        categoryId: { 
            type: Types.ObjectId,
            required: [true, 'Category id must be provided'],
        },
        salesmanId: { 
            type: Types.ObjectId,
            required: [true, 'Salesman id must be provided'],
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

productSchema.virtual('category', {
    ref: 'Category',
    localField: 'categoryId',
    foreignField: '_id'
});

productSchema.virtual('soldProducts', {
    ref: 'SoldProduct',
    localField: '_id',
    foreignField: 'productId'
});

productSchema.virtual('salesman', {
    ref: 'Salesman',
    localField: 'salesmanId',
    foreignField: '_id'
});

const Product = model('Product', productSchema);

export default Product;