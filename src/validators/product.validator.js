import Joi from "joi";

class ProductValidator {
    createProductValidator(data) {
        const product = Joi.object({
            name: Joi.string()
                .min(5)
                .max(15)
                .required(),
            description: Joi.string()
                .min(15)
                .max(150)
                .required(),
            price: Joi.number()
                .required(),
            quantity: Joi.number()
                .required(),
            color: Joi.string()
                .required(),
            categoryId: Joi.string()
                .required(),
            salesmanId: Joi.string()
                .required()
        });
        return product.validate(data);
    }

    updateProductValidator(data) {
        const product = Joi.object({
            name: Joi.string()
                .min(5)
                .max(15)
                .optional(),
            description: Joi.string()
                .min(15)
                .max(150)
                .optional(),
            price: Joi.number()
                .optional(),
            quantity: Joi.number()
                .optional(),
            color: Joi.string()
                .optional(),
            categoryId: Joi.string()
                .optional(),
            salesmanId: Joi.string()
                .optional()
        });
        return product.validate(data);
    }
}

export default ProductValidator;