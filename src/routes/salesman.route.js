import SalesmanController from "../controllers/salesman.controller.js";
import AuthGuard from "../guards/auth.guard.js";
import RoleGuard from "../guards/role.guard.js";
import { Router } from "express";

const controller = new SalesmanController();

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
    .post('/create', AuthGuard, RoleGuard(['superadmin', 'admin']), controller.createSalesman)
    .get('/get-all', AuthGuard, RoleGuard(['superadmin', 'admin']), controller.getAllSalesmen)
    .get('/get-by-id', AuthGuard, RoleGuard(['superadmin', 'admin', 'self']), controller.getSalesmanById)
    .patch('/update', AuthGuard, RoleGuard(['superadmin', 'admin', 'self']), controller.updateSalesman)
    .delete('/delete', AuthGuard, RoleGuard(['superadmin', 'admin', 'self']), controller.deleteSalesman)

export default router;