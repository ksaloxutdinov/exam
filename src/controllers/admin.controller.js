import Admin from "../models/admin.model.js";
import AdminValidation from "../validators/admin.validator.js";
import jwt from "jsonwebtoken";
import transport from "../utils/send-mail.js";
import Cryptography from "../utils/encryption.js";
import config from "../config/config.js";
import NodeCache from "node-cache";
import { isValidObjectId } from "mongoose";
import { successResponse, errorResponse } from "../helpers/response-handle.js";

const validation = new AdminValidation();
const crypto = new Cryptography();
const myCache = new NodeCache();

class AdminController {
    async createAdmin(req, res) {
        try {
            const { value, error } = validation.createValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { username, email, phone, role, password } = value;
            if (role === 'superadmin') {
                const superadmin = await Admin.findOne({ role: 'superadmin' });
                if (superadmin) return errorResponse(res, 'Superadmin already exists', 400);
            }
            const usernameExists = await Admin.findOne({ username });
            if (usernameExists) return errorResponse(res, 'Username is already taken', 400);
            const emailExists = await Admin.findOne({ email });
            if (emailExists) return errorResponse(res, 'Email already registered', 400);
            const phoneExists = await Admin.findOne({ phone });
            if (phoneExists) return errorResponse(res, 'Phone number already registered', 400);
            const hashedPassword = await crypto.encrypt(password);
            const admin = {
                ...value,
                hashedPassword
            }
            const newAdmin = await Admin.create(admin);
            newAdmin.hashedPassword = undefined;
            return successResponse(res, 'Admin account created successfully', newAdmin, 201);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async signin(req, res) {
        try {
            const { value, error } = validation.signinValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { username, password } = value;
            const admin = await Admin.findOne({ username }).select('+hashedPassword');
            if (!admin) return errorResponse(res, 'Username or password incorrect', 401);
            const passwordAccess = await crypto.decrypt(password, admin.hashedPassword);
            if (!passwordAccess) return errorResponse(res, 'Username or password incorrect', 401);

            const { email } = admin;
            const verificationCode = Math.floor(Math.random() * 1000000).toString();
            
            const info = await transport.sendMail({
                from: config.MAILER_ADDRESS,
                to: email,
                subject: 'Verification code',
                html: `<h1>${verificationCode}</h1>`
            });

            if (info.accepted[0] === email) {
                const hashedVerificationCode = crypto.hmacEncrypt(verificationCode, config.HMAC_SECRET);
                myCache.set(email, hashedVerificationCode, 120);
                return successResponse(res, 'Verification code sent successfully');
            }
            return errorResponse(res, 'Failed to send code', 400);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async confirmSignin(req, res) {
        try {
            const { value, error } = validation.confirmSigninValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { username, providedCode } = value;
            const admin = await Admin.findOne({ username });
            if (!admin) return errorResponse(res, 'Admin does not exist', 400);
            const { email } = admin;
            const hashedSentCode = await myCache.get(email);
            const hashedProvidedCode = crypto.hmacEncrypt(String(providedCode), config.HMAC_SECRET);
            if (hashedSentCode === hashedProvidedCode) {
                const payload = {
                    id: admin._id,
                    email: admin.email,
                    role: admin.role,
                    verified: admin.verified
                }
                const token = jwt.sign(payload, config.TOKEN_SECRET);
                res.cookie(
                    'Authorization',
                    'Bearer ' + token,
                    { 
                        expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
                        httpOnly: config.NODE_ENV === 'production',    
                        secure: config.NODE_ENV === 'production'
                    })
                    .json({
                        statusCode: 200,
                        message: 'Log in successful',
                        token
                    });
            }
            return errorResponse(res, 'Verfication code expired', 400);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async signout(_req, res) {
        try {
            res
                .clearCookie('Authorization')
                .status(200)
                .json({
                    statusCode: 200,
                    message: 'Sign out successful'
                })
        } catch (error) {
            return errorResponse(res, error.message)
        }
    }

    async sendVerificationCode(req, res) {
        try {
            const { email } = req.user;
            const admin = await Admin.findOne({ email });
            if (!admin) return errorResponse(res, 'Admin does not exists', 400);
            if (admin.verified) return errorResponse(res, 'You are already verified', 400);
            const verificationCode = Math.floor(Math.random() * 1000000).toString();
            
            const info = await transport.sendMail({
                from: config.MAILER_ADDRESS,
                to: email,
                subject: 'Verification code',
                html: `<h1>${verificationCode}</h1>`
            });

            if (info.accepted[0] === email) {
                const hashedVerificationCode = crypto.hmacEncrypt(verificationCode, config.HMAC_SECRET);
                myCache.set(email, hashedVerificationCode, 120);
                return successResponse(res, 'Verification code sent successfully');
            }
            return errorResponse(res, 'Failed to send code', 400);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async checkVerificationCode(req, res) {
        try {
            const { email } = req.user;
            const admin = await Admin.findOne({ email });
            if (!admin) return errorResponse(res, 'Admin does not exists', 400);
            const { value, error } = validation.checkVerificationValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { providedCode } = value;
            const hashedSentCode = await myCache.get(email);
            const hashedProvidedCode = crypto.hmacEncrypt(String(providedCode), config.HMAC_SECRET);
            if (hashedSentCode === hashedProvidedCode) {
                admin.verified = true;
                await admin.save();
                return successResponse(res, 'Accout has been verified');
            }
            return errorResponse(res, 'Verfication code expired', 400);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async changePassword(req, res) {
        try {
            const { email } = req.user;
            const admin = await Admin.findOne({ email }).select('+hashedPassword');
            if (!admin) return errorResponse(res, 'Admin does not exists', 400);
            const { value, error } = validation.changePasswordValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { oldPassword, newPassword } = value;
            if (oldPassword === newPassword) return errorResponse(res, 'New password cannot be the same', 400);
            const passwordAccess = await crypto.decrypt(oldPassword, admin.hashedPassword);
            if (!passwordAccess) return errorResponse(res, 'Old password is incorrect', 400);
            const newHashedPassword = await crypto.encrypt(newPassword);
            admin.hashedPassword = newHashedPassword;
            await admin.save();
            admin.hashedPassword = undefined;
            return successResponse(res, 'Password updated successfully', admin);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async sendForgotPasswordCode(req, res) {
        try {
            const { value, error } = validation.sendForgotPasswordCodeValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { email } = value;
            const admin = await Admin.findOne({ email });
            if (!admin) return errorResponse(res, 'Admin does not exists', 400);
            const verificationCode = Math.floor(Math.random() * 1000000).toString();
            const info = await transport.sendMail({
                from: config.MAILER_ADDRESS,
                to: email,
                subject: 'Forgot password verification code',
                html: `<h1>${verificationCode}</h1>`
            });

            if (info.accepted[0] === email) {
                const hashedVerificationCode = crypto.hmacEncrypt(verificationCode, config.HMAC_SECRET);
                myCache.set(email, hashedVerificationCode, 120);
                return successResponse(res, 'Verification code sent successfully');
            } 
            return errorResponse(res, 'Failed to send code', 400);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async checkForgotPasswordCode(req, res) {
        try {
            const { value, error } = validation.checkForgotPasswordCodeValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { email, providedCode, newPassword } = value;
            const admin = await Admin.findOne({ email });
            if (!admin) return errorResponse(res, 'Admin does not exists', 400);
            const hashedSentCode = await myCache.get(email);
            const hashedProvidedCode = crypto.hmacEncrypt(String(providedCode), config.HMAC_SECRET);
            if (hashedSentCode === hashedProvidedCode) {
                const newHashedPassword = await crypto.encrypt(newPassword);
                admin.hashedPassword = newHashedPassword;
                await admin.save();
                return successResponse(res, 'Password is reset successfully', admin);                
            }
            return errorResponse(res, 'Verfication code expired', 400);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async getAllAdmins(_req, res) {
        try {
            const admins = await Admin.find();
            return successResponse(res, admins);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async getAdminById(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const admin = await Admin.findById(id);
            if (!admin) return errorResponse(res, 'Admin not found', 404);
            return successResponse(res, _, admin);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async updateAdmin(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const admin = await Admin.findById(id);
            if (!admin) return errorResponse(res, 'Admin not found', 404);
            const { value, error } = validation.updateAdminValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);

            const usernameExists = await Admin.findOne({ username: value?.username });
            if (usernameExists) return errorResponse(res, 'Username is already taken', 400);
            const emailExists = await Admin.findOne({ email: value?.email });
            if (emailExists) return errorResponse(res, 'Email already registered', 400);
            const phoneExists = await Admin.findOne({ phone: value?.phone });
            if (phoneExists) return errorResponse(res, 'Phone number already registered', 400);

            const updatedAdmin = await Admin.findByIdAndUpdate(id, {
                ...value,
                verified: false
            }, {
                new: true
            });
            return successResponse(res, 'Admin updated successfully', updatedAdmin);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async deleteAdmin(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const admin = await Admin.findById(id);
            if (!admin) return errorResponse(res, 'Admin not found', 404);
            await Admin.findByIdAndDelete(id);
            return successResponse(res, 'Admin deleted successfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }
}

export default AdminController;