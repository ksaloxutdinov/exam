import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import SoldProduct from "../models/sold-product.model.js";
import CategoryValidator from "../validators/category.validator.js";
import { isValidObjectId } from "mongoose";
import { successResponse, errorResponse } from "../helpers/response-handle.js";

const validation = new CategoryValidator();

class CategoryController {
    async createCategory(req, res) {
        try {
            const { value, error } = validation.createCategoryValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { name, description } = value;

            const nameExists = await Category.findOne({ name });
            if (nameExists) return errorResponse(res, 'Category already exists', 400);

            const category = {
                name, 
                description
            }
            await Category.create(category);
            return successResponse(res, 'Category created successfully', category, 201);
        } catch (error) {
            return errorResponse(res, error.message);            
        }
    }

    async getAllCategories(_req, res) {
        try {
            const categories = await Category.find().populate('products');
            return successResponse(res, 'Success', categories);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async getCategoryById(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const category = await Category.findById(id).populate('products');
            if (!category) return errorResponse(res, 'Category not found', 404);
            return successResponse(res, 'Success', category);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async updateCategory(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const category = await Category.findById(id);
            if (!category) return errorResponse(res, 'Category not found', 404);
            
            const { value, error } = validation.updateCategoryValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            
            if (value.name) {
                const nameExists = await Category.findOne({ name: value.name });
                if (nameExists) return errorResponse(res, 'Category already exists', 400);
            }

            const updatedCategory = await Category.findByIdAndUpdate(id, {
                ...value
            }, { new: true });

            return successResponse(res, 'Category updated successfully', updatedCategory);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async deleteCategory(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const category = await Category.findById(id);
            if (!category) return errorResponse(res, 'Category not found', 404);

            const products = await Product.find({ salesmanId: id });
            for (let product of products) {
                await SoldProduct.deleteMany({ productId: product._id });
            }
            await Product.deleteMany({ salesmanId: id });

            await Category.findByIdAndDelete(id);

            return successResponse(res, 'Category deleted successfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }
}

export default CategoryController;