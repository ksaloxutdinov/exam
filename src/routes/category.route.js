import CategoryController from "../controllers/category.controller.js";
import AuthGuard from "../guards/auth.guard.js";
import RoleGuard from "../guards/role.guard.js";
import { Router } from "express";

const controller = new CategoryController();

const router = Router();

router
    //CRUD
    .post('/create', AuthGuard, RoleGuard(['superadmin', 'admin', 'salesman']), controller.createCategory)
    .get('/get-all', controller.getAllCategories)
    .get('/get-by-id', controller.getCategoryById)
    .patch('/update', AuthGuard, RoleGuard(['superadmin', 'admin', 'salesman']), controller.updateCategory)
    .delete('/delete', AuthGuard, RoleGuard(['superadmin', 'admin', 'salesman']), controller.deleteCategory);

export default router;