const express = require("express");

const adminController = require("../controllers/adminController");

const router = express.Router();

router.get("/add-product", adminController.getAddProduct);

router.post("/product", adminController.postAddProduct);

router.get("/edit-product/:productId", adminController.getEditProduct);

router.post("/edit-product/:productId", adminController.postEditProduct);

router.post("/delete-product/:productId", adminController.postDeleteProduct);

module.exports = router;
