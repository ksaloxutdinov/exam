import ProductController from "../controllers/product.controller.js";
import AuthGuard from "../guards/auth.guard.js";
import RoleGuard from "../guards/role.guard.js";
import { Router } from "express";

const controller = new ProductController();

const router = Router();

router
    //CRUD
    .post('/create', AuthGuard, RoleGuard(['superadmin', 'admin', 'salesman']), controller.createProduct)
    .get('/get-all', controller.getAllProducts)
    .get('/get-by-id', controller.getProductById)
    .patch('/update', AuthGuard, RoleGuard(['superadmin', 'admin', 'salesman']), controller.updateProduct)
    .delete('/delete', AuthGuard, RoleGuard(['superadmin', 'admin', 'salesman']), controller.deleteProduct);

export default router;