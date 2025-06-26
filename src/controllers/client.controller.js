import Client from "../models/client.model.js";
import SoldProduct from "../models/sold-product.model.js";
import ClientValidator from "../validators/client.validator.js";
import jwt from "jsonwebtoken";
import transport from "../utils/send-mail.js";
import Cryptography from "../utils/encryption.js";
import NodeCache from "node-cache";
import { isValidObjectId } from "mongoose";
import { successResponse, errorResponse } from "../helpers/response-handle.js";
import config from "../config/config.js";

const validation = new ClientValidator();
const crypto = new Cryptography();
const myCache = new NodeCache();

class ClientController {
    async signup(req, res) {
        try {
            const { value, error } = validation.signupValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { username, email, phone, password } = value;
            const usernameExists = await Client.findOne({ username });
            if (usernameExists) return errorResponse(res, 'Username is already taken', 400);
            const emailExists = await Client.findOne({ email });
            if (emailExists) return errorResponse(res, 'Email already registered', 400);
            const phoneExists = await Client.findOne({ phone });
            if (phoneExists) return errorResponse(res, 'Phone number already registered', 400);
            const hashedPassword = await crypto.encrypt(password);
            const client = {
                ...value,
                hashedPassword
            }
            const newClient = await Client.create(client);
            newClient.hashedPassword = undefined;
            return successResponse(res, newClient, 'Client account created successfully', 201);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async signin(req, res) {
        try {
            const { value, error } = validation.signinValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { username, password } = value;
            const client = await Client.findOne({ username }).select('+hashedPassword');
            if (!client) return errorResponse(res, 'Username or password incorrect', 401);
            const passwordAccess = await crypto.decrypt(password, client.hashedPassword);
            if (!passwordAccess) return errorResponse(res, 'Username or password incorrect', 401);

            const { email } = client;
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
            const client = await Client.findOne({ username });
            if (!client) return errorResponse(res, 'Client does not exist', 400);
            const { email } = client;
            const hashedSentCode = await myCache.get(email);
            const hashedProvidedCode = crypto.hmacEncrypt(String(providedCode), config.HMAC_SECRET);
            if (hashedSentCode === hashedProvidedCode) {
                const payload = {
                    id: client._id,
                    email: client.email,
                    role: client.role,
                    verified: client.verified
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
            const client = await Client.findOne({ email });
            if (!client) return errorResponse(res, 'Client does not exist', 400);
            if (client.verified) return errorResponse(res, 'You are already verified', 400);
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
            const client = await Client.findOne({ email });
            if (!client) return errorResponse(res, 'Client does not exist', 400);
            const { value, error } = validation.checkVerificationValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { providedCode } = value;
            const hashedSentCode = await myCache.get(email);
            const hashedProvidedCode = crypto.hmacEncrypt(String(providedCode), config.HMAC_SECRET);
            if (hashedSentCode === hashedProvidedCode) {
                client.verified = true;
                await client.save();
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
            const client = await Client.findOne({ email }).select('+hashedPassword');
            if (!client) return errorResponse(res, 'Client does not exist', 400);
            const { value, error } = validation.changePasswordValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { oldPassword, newPassword } = value;
            if (oldPassword === newPassword) return errorResponse(res, 'New password cannot be the same', 400);
            const passwordAccess = await crypto.decrypt(oldPassword, client.hashedPassword);
            if (!passwordAccess) return errorResponse(res, 'Old password is incorrect', 400);
            const newHashedPassword = await crypto.encrypt(newPassword);
            client.hashedPassword = newHashedPassword;
            await client.save();
            client.hashedPassword = undefined;
            return successResponse(res, 'Password updated successfully', client);
        } catch (error) {
            return errorResponse(res, error.message)
        }
    }

    async sendForgotPasswordCode(req, res) {
        try {
            const { value, error } = validation.sendForgotPasswordCodeValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);
            const { email } = value;
            const client = await Client.findOne({ email });
            if (!client) return errorResponse(res, 'Clint does not exist', 400);
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
            const client = await Client.findOne({ email });
            if (!client) return errorResponse(res, 'Client does not exists', 400);
            const hashedSentCode = await myCache.get(email);
            const hashedProvidedCode = crypto.hmacEncrypt(String(providedCode), config.HMAC_SECRET);
            if (hashedSentCode === hashedProvidedCode) {
                const newHashedPassword = await crypto.encrypt(newPassword);
                client.hashedPassword = newHashedPassword;
                await client.save();
                return successResponse(res, 'Password is reset successfully', client);                
            }
            return errorResponse(res, 'Verfication code expired', 400);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async getAllClients(_req, res) {
        try {
            const clients = await Client.find().populate('purchasedProducts');
            return successResponse(res, 'Success', clients);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async getClientById(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const client = await Client.findById(id).populate('purchasedProducts');
            if (!client) return errorResponse(res, 'Client not found', 404);
            return successResponse(res, 'Success', client);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async updateClient(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const client = await Client.findById(id);
            if (!client) return errorResponse(res, 'Client not found', 404);
            const { value, error } = validation.updateClientValidator(req.body);
            if (error) return errorResponse(res, `Validation error: ${error.message}`, 422);

            const usernameExists = await Client.findOne({ username: value?.username });
            if (usernameExists) return errorResponse(res, 'Username is already taken', 400);
            const emailExists = await Client.findOne({ email: value?.email });
            if (emailExists) return errorResponse(res, 'Email already registered', 400);
            const phoneExists = await Client.findOne({ phone: value?.phone });
            if (phoneExists) return errorResponse(res, 'Phone number already registered', 400);

            const updatedClient = await Client.findByIdAndUpdate(id, {
                ...value,
                verified: false
            }, {
                new: true
            });
            return successResponse(res, 'Client updated successfully', updatedClient);
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }

    async deleteClient(req, res) {
        try {
            const id = req.query.id;
            if (!isValidObjectId(id)) return errorResponse(res, 'Invalid object id', 400);
            const client = await Client.findById(id);
            if (!client) return errorResponse(res, 'Client not found', 404);
            await SoldProduct.deleteMany({ clientId: id });
            await Client.findByIdAndDelete(id);
            return successResponse(res, 'Client deleted succesfully');
        } catch (error) {
            return errorResponse(res, error.message);
        }
    }
}

export default ClientController;