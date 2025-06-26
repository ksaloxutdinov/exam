import Admin from "../models/admin.model.js";
import AdminValidation from "../validators/admin.validator.js";
import config from "../config/config.js";
import Cryptography from "../utils/encryption.js";
import { disconnect } from "mongoose";
import { connectDB } from "./index.js";

const validator = new AdminValidation();
const crypto = new Cryptography();

const createSuperadmin = async () => {
    try {
        const connected = await connectDB();
        const superadmin = await Admin.findOne({ role: 'superadmin' });
        if (superadmin) throw new Error('Superadmin already exists');
        if (!connected) throw new Error('Database not connected');
        const newSuperadmin = {
            username: config.SUPERADMIN_USERNAME,
            email: config.SUPERADMIN_EMAIL,
            phone: config.SUPERADMIN_PHONE,
            role: 'superadmin',
            password: config.SUPERADMIN_PASSWORD
        }
        const { value, error } = validator.createValidator(newSuperadmin);
        if (error) throw new Error(error);
        const hashedPassword = await crypto.encrypt(value.password);
        await Admin.create({
            ...value,
            hashedPassword
        });
        console.log('Superadmin created successfully');
    } catch (error) {
        console.log(`Error on creating superadmin. ${error}`);
    }
}

await createSuperadmin();
disconnect();