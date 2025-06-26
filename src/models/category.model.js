import { Schema, model } from "mongoose";

const categorySchema = new Schema(
    {
        name: {
            type: String,
            unique: [true, 'Category name must be unique'],
            required: [true, 'Category name must be provided'],
            trim: true
        },
        description: {
            type: String,
            required: [true, 'Description must be provided'],
            trim: true
        }
    },  
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true } 
    }
);

categorySchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'categoryId'
});

const Category = model('Category', categorySchema);

export default Category;