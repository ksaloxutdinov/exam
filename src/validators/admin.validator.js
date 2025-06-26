import Joi from "joi";

class AdminValidation {
    createValidator(data) {
        const admin = Joi.object({
            username: Joi.string()
                .min(4)
                .max(15)
                .required()
                .regex(/[a-zA-Z0-9]/),
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
            role: Joi.string()
                .valid('superadmin', 'admin')
                .optional(),
            password: Joi.string()
                .required()
                .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/)
        });
        return admin.validate(data);
    }

    signinValidator(data) {
        const admin = Joi.object({
            username: Joi.string()
                .min(4)
                .max(15)
                .required()
                .regex(/[a-zA-Z0-9]/),
            password: Joi.string()
                .required()
        });
        return admin.validate(data);
    }

    confirmSigninValidator(data) {
        const admin = Joi.object({
            username: Joi.string()
                .min(4)
                .max(15)
                .required()
                .regex(/[a-zA-Z0-9]/),
            providedCode: Joi.number()
                .required()
        });
        return admin.validate(data);
    }

    checkVerificationValidator(data) {
        const admin = Joi.object({
            providedCode: Joi.number()
                .required()            
        });
        return admin.validate(data);
    }

    changePasswordValidator(data) {
        const admin = Joi.object({
            oldPassword: Joi.string()
                .required(),
            newPassword: Joi.string()
                .required()
                .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/)
        });
        return admin.validate(data);
    }

    sendForgotPasswordCodeValidator(data) {
        const admin = Joi.object({
            email: Joi.string()
                .min(5)
                .max(50)
                .required()
                .email({
                    tlds: { allow: ['com', 'net']}
                })
        });
        return admin.validate(data);
    }

    checkForgotPasswordCodeValidator(data) {
        const admin = Joi.object({
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
        return admin.validate(data);
    }

    updateAdminValidator(data) {
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
                .regex(/^\+998\d{9}$/)
        });
        return admin.validate(data);
    }
}

export default AdminValidation;