import Product from "../models/product.model.js";
import SoldProduct from "../models/sold-product.model.js";
import Salesman from "../models/salesman.model.js";
import Category from "../models/category.model.js";
import ProductValidator from "../validators/product.validator.js";
import { isValidObjectId } from "mongoose";
import { successResponse, errorResponse } from "../helpers/response-handle.js";

const validation = new ProductValidator();

class ProductController {
    async createProduct(req, res) {
        try {
            const { value, error } = validation.createProductValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { name, salesmanId, categoryId } = value;

            const nameExists = await Product.findOne({ name });
            if (nameExists) return errorResponse(res, 'Product already exists', 400);

            const salesman = await Salesman.findById(salesmanId);
            if (!salesman) return errorResponse(res, 'Salesman does not exist', 400);

            const category = await Category.findById(categoryId);
            if (!category) return errorResponse(res, 'Category does not exist', 400);
            
            const product = {
                ...value
            }
            await Product.create(product);
            return successResponse(res, 'Product created successfully', product, 201);
        } catch (error) {
            return errorResponse(res, error.message);            
        }
    }

    async getAllProducts(_req, res) {
        try {
            const products = await Product.find().populate('soldProducts').populate('category').populate('salesman');
            return successResponse(res, 'Success', products);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async getProductById(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const product = await Product.findById(id).populate('soldProducts').populate('category').populate('salesman');
            if (!product) return errorResponse(res, 'Product not found', 404);
            return successResponse(res, 'Success', product);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async updateProduct(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const product = await Product.findById(id);
            if (!product) return errorResponse(res, 'Product not found', 404);
            
            const { value, error } = validation.updateProductValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            
            if (value.name) {
                const nameExists = await Product.findOne({ name: value.name });
                if (nameExists) return errorResponse(res, 'Product already exists', 400);
            }

            if (value.salesmanId) {
                const salesman = await Salesman.findById(value.salesmanId);
                if (!salesman) return errorResponse(res, 'Salesman does not exist', 400);
            }

            if (value.categoryId) {
                const category = await Category.findById(value.categoryId);
                if (!category) return errorResponse(res, 'Category does not exist', 400);
            }

            const updatedProduct= await Product.findByIdAndUpdate(id, {
                ...value
            }, { new: true });

            return successResponse(res, 'Product updated successfully', updatedProduct);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async deleteProduct(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const product = await Product.findById(id);
            if (!product) return errorResponse(res, 'Product not found', 404);

            await SoldProduct.deleteMany({ productId: id });

            await Product.findByIdAndDelete(id);

            return successResponse(res, 'Product deleted successfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }
}

export default ProductController;