import nodemailer from "nodemailer";
import config from "../config/config.js";

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.MAILER_ADDRESS,
        pass: config.MAILER_PASSWORD
    }
});

export default transport;