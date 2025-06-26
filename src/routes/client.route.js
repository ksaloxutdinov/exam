import ClientController from "../controllers/client.controller.js";
import AuthGuard from "../guards/auth.guard.js";
import RoleGuard from "../guards/role.guard.js";
import { Router } from "express";

const controller = new ClientController();

const router = Router();

router
    //Authorization
    .post('/signup', controller.signup)
    .post('/signin', controller.signin)
    .post('/confirm-signin', controller.confirmSignin)
    .post('/signout', AuthGuard, controller.signout)

    .post('/send-verification', AuthGuard, controller.sendVerificationCode)
    .patch('/check-verification', AuthGuard, controller.checkVerificationCode)

    .patch('/change-password', AuthGuard, controller.changePassword)
    .post('/send-forgot-password-code', controller.sendForgotPasswordCode)
    .patch('/check-forgot-password-code', controller.checkForgotPasswordCode)

    //CRUD
    .get('/get-all', AuthGuard, RoleGuard(['superadmin', 'admin']), controller.getAllClients)
    .get('/get-by-id', AuthGuard, RoleGuard(['superadmin', 'admin', 'self']), controller.getClientById)
    .patch('/update', AuthGuard, RoleGuard(['superadmin', 'admin', 'self']), controller.updateClient)
    .delete('/delete', AuthGuard, RoleGuard(['superadmin', 'admin', 'self']), controller.deleteClient);


export default router;