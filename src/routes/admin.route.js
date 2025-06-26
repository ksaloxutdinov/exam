import AdminController from "../controllers/admin.controller.js";
import AuthGuard from "../guards/auth.guard.js";
import RoleGuard from "../guards/role.guard.js";
import { Router } from "express";

const controller = new AdminController();

const router = Router();

router
    //Authorization
    .post('/signin', controller.signin)
    .post('/confirm-signin', controller.confirmSignin)
    .post('/signout', AuthGuard, controller.signout)
    
    .post('/send-verification', AuthGuard, controller.sendVerificationCode)
    .patch('/check-verification', AuthGuard, controller.checkVerificationCode)

    .patch('/change-password', AuthGuard, controller.changePassword)
    .post('/send-forgot-password-code', controller.sendForgotPasswordCode)
    .patch('/check-forgot-password-code', controller.checkForgotPasswordCode)

    //CRUD
    .post('/create', AuthGuard, RoleGuard('superadmin'), controller.createAdmin)
    .get('/get-all', AuthGuard, RoleGuard('superadmin'), controller.getAllAdmins)
    .get('/get-by-id', AuthGuard, RoleGuard(['superadmin', 'self']), controller.getAdminById)
    .patch('/update', AuthGuard, RoleGuard(['superadmin', 'self']), controller.updateAdmin)
    .delete('/delete', AuthGuard, RoleGuard(['superadmin', 'self']), controller.deleteAdmin)

export default router;