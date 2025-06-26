import Salesman from "../models/salesman.model.js";
import Product from "../models/product.model.js";
import SoldProduct from "../models/sold-product.model.js";
import SalesmanValidation from "../validators/salesman.validator.js";
import jwt from "jsonwebtoken";
import transport from "../utils/send-mail.js";
import Cryptography from "../utils/encryption.js";
import NodeCache from "node-cache";
import { isValidObjectId } from "mongoose";
import { successResponse, errorResponse } from "../helpers/response-handle.js";
import config from "../config/config.js";

const validation = new SalesmanValidation();
const crypto = new Cryptography();
const myCache = new NodeCache();

class SalesmanController {
    async createSalesman(req, res) {
        try {
            const { value, error } = validation.createValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { username, email, phone, password } = value;
            const usernameExists = await Salesman.findOne({ username });
            if (usernameExists) return errorResponse(res, 'Username is already taken', 400);
            const emailExists = await Salesman.findOne({ email });
            if (emailExists) return errorResponse(res, 'Email already registered', 400);
            const phoneExists = await Salesman.findOne({ phone });
            if (phoneExists) return errorResponse(res, 'Phone number already registered', 400);
            const hashedPassword = await crypto.encrypt(password);
            const salesman = {
                ...value,
                hashedPassword
            }
            const newSalesman = await Salesman.create(salesman);
            newSalesman.hashedPassword = undefined;
            return successResponse(res, newSalesman, 'Salesman account created successfully', 201);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async signin(req, res) {
        try {
            const { value, error } = validation.signinValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { username, password } = value;
            const salesman = await Salesman.findOne({ username }).select('+hashedPassword');
            if (!salesman) return errorResponse(res, 'Username or password incorrect', 401);
            const passwordAccess = await crypto.decrypt(password, salesman.hashedPassword);
            if (!passwordAccess) return errorResponse(res, 'Username or password incorrect', 401);

            const { email } = salesman;
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
            return errorResponse(res, 'Failed to send code', 400)
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async confirmSignin(req, res) {
        try {
            const { value, error } = validation.confirmSigninValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { username, providedCode } = value;
            const salesman = await Salesman.findOne({ username });
            if (!salesman) return errorResponse(res, 'Salesman does not exist', 400);
            const { email } = salesman;
            const hashedSentCode = await myCache.get(email);
            const hashedProvidedCode = crypto.hmacEncrypt(String(providedCode), config.HMAC_SECRET);
            if (hashedSentCode === hashedProvidedCode) {
                const payload = {
                    id: salesman._id,
                    email: salesman.email,
                    role: salesman.role,
                    verified: salesman.verified
                }
                const token = jwt.sign(payload, config.TOKEN_SECRET);
                res.cookie(
                    'Authorization',
                    'Bearer ' + token,
                    {
                        expires: new Date(Date.now() + 4 * 60 * 60 * 1000),
                        httpOnly: config.NODE_ENV === 'production',
                        secure: config.NODE_ENV === 'production'
                    })
                    .json({
                        statusCode: 200,
                        message: 'Log in successful',
                        token
                    });
            }
            return errorResponse(res, 'Verification code expired', 400);
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
            return errorResponse(res, error.message);
        }
    }

    async sendVerificationCode(req, res) {
        try {
            const { email } = req.user;
            const salesman = await Salesman.findOne({ email });
            if (!salesman) return errorResponse(res, 'Salesman does not exist', 400);
            if (salesman.verified) return errorResponse(res, 'You are already verified', 400);
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
            const salesman = await Salesman.findOne({ email });
            if (!salesman) return errorResponse(res, 'Salesman does not exist', 400);
            const { value, error } = validation.checkVerificationValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { providedCode } = value;
            const hashedSentCode = await myCache.get(email);
            const hashedProvidedCode = crypto.hmacEncrypt(String(providedCode), config.HMAC_SECRET);
            if (hashedSentCode === hashedProvidedCode) {
                salesman.verified = true;
                await salesman.save();
                return successResponse(res, 'Account has been verified');
            }
            return errorResponse(res, 'Verification code expired', 400);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async changePassword(req, res) {
        try {
            const { email } = req.user;
            const salesman = await Salesman.findOne({ email }).select('+hashedPassword');
            if (!salesman) return errorResponse(res, 'Salesman does not exist', 400);
            const { value, error } = validation.changePasswordValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { oldPassword, newPassword } = value;
            if (oldPassword === newPassword) return errorResponse(res, 'New password cannot be the same', 400);
            const passwordAccess = await crypto.decrypt(oldPassword, salesman.hashedPassword);
            if (!passwordAccess) return errorResponse(res, 'Old password is incorrect', 400);
            const newHashedPassword = await crypto.encrypt(newPassword);
            salesman.hashedPassword = newHashedPassword;
            await salesman.save();
            salesman.hashedPassword = undefined;
            return successResponse(res, 'Password updated successfully', salesman);
        } catch (error) {
            return errorResponse(res, error.message)
        }
    }

    async sendForgotPasswordCode(req, res) {
        try {
            const { value, error } = validation.sendForgotPasswordCodeValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { email } = value;
            const salesman = await Salesman.findOne({ email });
            if (!salesman) return errorResponse(res, 'Salesman does not exist', 400);
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
            const salesman = await Salesman.findOne({ email });
            if (!salesman) return errorResponse(res, 'Salesman does not exists', 400);
            const hashedSentCode = await myCache.get(email);
            const hashedProvidedCode = crypto.hmacEncrypt(String(providedCode), config.HMAC_SECRET);
            if (hashedSentCode === hashedProvidedCode) {
                const newHashedPassword = await crypto.encrypt(newPassword);
                salesman.hashedPassword = newHashedPassword;
                await salesman.save();
                return successResponse(res, 'Password is reset successfully', salesman);                
            }
            return errorResponse(res, 'Verfication code expired', 400);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async getAllSalesmen(_req, res) {
        try {
            const salesmen = await Salesman.find().populate('products');
            return successResponse(res, 'Success', salesmen);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async getSalesmanById(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const salesman = await Salesman.findById(id).populate('products');
            if (!salesman) return errorResponse(res, 'Salesman not found', 404);
            return successResponse(res, 'Success', salesman);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async updateSalesman(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const salesman = await Salesman.findById(id);
            if (!salesman) return errorResponse(res, 'Salesman not found', 404);
            const { value, error } = validation.updateSalesmanValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);

            const usernameExists = await Salesman.findOne({ username: value?.username });
            if (usernameExists) return errorResponse(res, 'Username is already taken', 400);
            const emailExists = await Salesman.findOne({ email: value?.email });
            if (emailExists) return errorResponse(res, 'Email already registered', 400);
            const phoneExists = await Salesman.findOne({ phone: value?.phone });
            if (phoneExists) return errorResponse(res, 'Phone number already registered', 400);

            const updatedClient = await Salesman.findByIdAndUpdate(id, {
                ...value,
                verified: false
            }, {
                new: true
            });
            return successResponse(res, 'Salesman updated successfully', updatedClient);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async deleteSalesman(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const salesman = await Salesman.findById(id);
            if (!salesman) return errorResponse(res, 'Salesman not found', 404);
            const products = await Product.find({ salesmanId: id });
            for (let product of products) {
                await SoldProduct.deleteMany({ productId: product._id });
            }
            await Product.deleteMany({ salesmanId: id });
            await Salesman.findByIdAndDelete(id);
            return successResponse(res, 'Salesman deleted succesfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }
}

export default SalesmanController;