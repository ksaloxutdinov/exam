import Joi from "joi";

class ClientValidator {
    signupValidator(data) {
        const client = Joi.object({
            username: Joi.string()
                .min(4)
                .max(15)
                .required()
                .regex(/[a-zA-Z0-9]/),
            fullName: Joi.string()
                .min(3)
                .required(),
            email: Joi.string()
                .min(5)
                .max(50)
                .required()
                .email({
                    tlds: { allow: ['com', 'net']}
                }),
            phone: Joi.string()
                .required()
                .regex(/^\+998\d{9}$/),
            address: Joi.string()
                .min(4)
                .max(100)
                .required(),
            password: Joi.string()
                .required()
                .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/)
        });
        return client.validate(data);
    }

    signinValidator(data) {
        const client = Joi.object({
            username: Joi.string()
                .min(4)
                .max(15)
                .required()
                .regex(/[a-zA-Z0-9]/),
            password: Joi.string()
                .required()
        });
        return client.validate(data);
    }

    confirmSigninValidator(data) {
        const client = Joi.object({
            username: Joi.string()
                .min(4)
                .max(15)
                .required()
                .regex(/[a-zA-Z0-9]/),
            providedCode: Joi.number()
                .required()
        });
        return client.validate(data);
    }

    checkVerificationValidator(data) {
        const client = Joi.object({
            providedCode: Joi.number()
                .required()            
        });
        return client.validate(data);
    }

    changePasswordValidator(data) {
        const client = Joi.object({
            oldPassword: Joi.string()
                .required(),
            newPassword: Joi.string()
                .required()
                .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/)
        });
        return client.validate(data);
    }

    sendForgotPasswordCodeValidator(data) {
        const client = Joi.object({
            email: Joi.string()
                .min(5)
                .max(50)
                .required()
                .email({
                    tlds: { allow: ['com', 'net']}
                })
        });
        return client.validate(data);
    }

    checkForgotPasswordCodeValidator(data) {
        const client = Joi.object({
            email: Joi.string()
                .min(5)
                .max(50)
                .required()
                .email({
                    tlds: { allow: ['com', 'net']}
                }),
            providedCode: Joi.number()
                .required(),
            newPassword: Joi.string()
                .required()
                .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/)
        });
        return client.validate(data);
    }

    updateClientValidator(data) {
        const admin = Joi.object({
            username: Joi.string()
                .min(4)
                .max(15)
                .optional()
                .regex(/[a-zA-Z0-9]/),
            email: Joi.string()
                .min(5)
                .max(50)
                .optional()
                .email({
                    tlds: { allow: ['com', 'net']}
                }),
            phone: Joi.string()
                .optional()
                .regex(/^\+998\d{9}$/),
            fullName: Joi.string()
                .min(3)
                .optional(),
            address: Joi.string()
                .min(4)
                .max(100)
                .optional()
        });
        return admin.validate(data);
    }
}

export default ClientValidator;