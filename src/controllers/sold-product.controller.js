import SoldProduct from "../models/sold-product.model.js";
import Product from "../models/product.model.js";
import Client from "../models/client.model.js";
import SoldProductValidator from "../validators/sold-product.validator.js";
import { isValidObjectId } from "mongoose";
import { successResponse, errorResponse } from "../helpers/response-handle.js";

const validation = new SoldProductValidator();

class SoldProductController {
    async createSoldProduct(req, res) {
        try {
            const { value, error } = validation.createSoldProductValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { productId, clientId, quantity } = value;

            const product = await Product.findOne({ _id: productId });
            if (!product) return errorResponse(res, 'Product does not exist', 400);

            const client = await Client.findOne({ _id: clientId});
            if (!client) return errorResponse(res, 'Client deos not exist', 400);

            if (quantity > product.quantity) return errorResponse(res, 'Sold product quantity is more that available product quantity');

            const totalPrice = quantity * product.price;
            product.quantity -= quantity;
            
            const soldProduct = {
                ...value,
                totalPrice
            }
            await SoldProduct.create(soldProduct);
            await product.save();
            return successResponse(res, 'Sold product created successfully', soldProduct, 201);
        } catch (error) {
            return errorResponse(res, error.message);            
        }
    }

    async getAllSoldProducts(_req, res) {
        try {
            const products = await SoldProduct.find().populate('product').populate('client');
            return successResponse(res, 'Success', products);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async getSoldProductById(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const product = await SoldProduct.findById(id).populate('product').populate('client');
            if (!product) return errorResponse(res, 'Sold product not found', 404);
            return successResponse(res, 'Success', product);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async updateSoldProduct(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const soldProduct = await SoldProduct.findById(id);
            if (!soldProduct) return errorResponse(res, 'Sold product not found', 404);

            const { value, error } = validation.updateSoldProductValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { productId, clientId, quantity } = value;

            if (productId) {
                product = await Product.findById(productId);
                if (!product) return errorResponse(res, 'Product does not exist', 400);
            }

            if (clientId) {
                const client = await Client.findById(clientId);
                if (!client) return errorResponse(res, 'Client deos not exist', 400);
            }

            const product = await Product.findById(soldProduct.productId);

            if (quantity > product.quantity + soldProduct.quantity) return errorResponse(res, 'Sold product quantity is more that available product quantity');

            const totalPrice = quantity * product.price;
            product.quantity += soldProduct.quantity;
            product.quantity -= quantity;
            
            const updatedSoldProduct = {
                ...value,
                totalPrice
            }

            await SoldProduct.findByIdAndUpdate(id, updatedSoldProduct);
            await product.save();

            return successResponse(res, 'Sold product updated successfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async deleteSoldProduct(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const product = await SoldProduct.findById(id);
            if (!product) return errorResponse(res, 'Product not found', 404);

            await SoldProduct.findByIdAndDelete(id);

            return successResponse(res, 'Sold product deleted successfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }
}

export default SoldProductController;