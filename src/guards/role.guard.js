import { errorResponse } from "../helpers/response-handle.js";

const RoleGuard = (roles) => {
    return (req, res, next) => {
        if (roles.includes('self') && (req.user.id === req.query.id)) {
            next();
        }
        else if (!roles.includes(req.user.role)) {
            return errorResponse(res, 'Access denied', 403);
        } else {
            next();
        }
    }
}

export default RoleGuard;