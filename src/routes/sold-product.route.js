import SoldProductController from "../controllers/sold-product.controller.js";
import AuthGuard from "../guards/auth.guard.js";
import RoleGuard from "../guards/role.guard.js";
import { Router } from "express";

const controller = new SoldProductController();

const router = Router();

router
    //CRUD
    .post('/create', AuthGuard, RoleGuard(['superadmin', 'admin', 'salesman']), controller.createSoldProduct)
    .get('/get-all', AuthGuard, RoleGuard('salesman'), controller.getAllSoldProducts)
    .get('/get-by-id', AuthGuard, RoleGuard('salesman'), controller.getSoldProductById)
    .patch('/update', AuthGuard, RoleGuard(['superadmin', 'admin', 'salesman']), controller.updateSoldProduct)
    .delete('/delete', AuthGuard, RoleGuard(['superadmin', 'admin', 'salesman']), controller.deleteSoldProduct);

export default router;