import jwt from "jsonwebtoken";
import config from "../config/config.js";
import { errorResponse } from "../helpers/response-handle.js";

const AuthGuard = async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return errorResponse(res, 'Unauthorized user', 401);
    const bearer = auth.split(' ')[0];
    const token = auth.split(' ')[1];
    if (bearer !== 'Bearer' || !token) return errorResponse(res, 'Invalid token', 401);
    try {
        const user = jwt.verify(token, config.TOKEN_SECRET);
        req.user = user;
        next();
    } catch (error) {
        return errorResponse(res, 'Unauthorized user', 401);
    }
}

export default AuthGuard;