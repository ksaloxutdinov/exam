import { config } from "dotenv";

config();

export default {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    MAILER_ADDRESS: process.env.MAILER_ADDRESS,
    MAILER_PASSWORD: process.env.MAILER_PASSWORD,
    SUPERADMIN_USERNAME: process.env.SUPERADMIN_USERNAME,
    SUPERADMIN_PASSWORD: process.env.SUPERADMIN_PASSWORD,
    SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
    SUPERADMIN_PHONE: process.env.SUPERADMIN_PHONE,
    TOKEN_SECRET: process.env.TOKEN_SECRET,
    HMAC_SECRET: process.env.HMAC_SECRET,
    NODE_ENV: process.env.NODE_ENV
}