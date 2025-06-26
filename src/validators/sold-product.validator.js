import Joi from "joi";

class SoldProductValidator {
    createSoldProductValidator(data) {
        const product = Joi.object({
            productId: Joi.string()
                .required(),
            clientId: Joi.string()
                .required(),
            quantity: Joi.number()
                .required()
        });
        return product.validate(data);
    }

    updateSoldProductValidator(data) {
        const product = Joi.object({
            productId: Joi.string()
                .optional(),
            clientId: Joi.string()
                .optional(),
            quantity: Joi.number()
                .optional()
        });
        return product.validate(data);
    }
}

export default SoldProductValidator;