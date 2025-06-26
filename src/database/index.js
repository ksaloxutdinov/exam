import config from "../config/config.js";
import { connect } from "mongoose";

export const connectDB = async () => {
    try {
        await connect(config.MONGO_URI);
        console.log('Database connected successfully');
        return true;
    } catch (error) {
        console.log(`Error on connecting database: ${error.message}`);
        return false;
    }
}