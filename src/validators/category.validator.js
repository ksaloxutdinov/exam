import Joi from "joi";

class CategoryValidator {
    createCategoryValidator(data) {
        const category = Joi.object({
            name: Joi.string()
                .min(5)
                .max(15)
                .required(),
            description: Joi.string()
                .min(15)
                .max(150)
                .required()
        });
        return category.validate(data);
    }

    updateCategoryValidator(data) {
        const category = Joi.object({
            name: Joi.string()
                .min(5)
                .max(15)
                .optional(),
            description: Joi.string()
                .min(15)
                .max(150)
                .optional()
        });
        return category.validate(data);
    }
}

export default CategoryValidator;