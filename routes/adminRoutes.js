const express = require("express");

const adminController = require("../controllers/adminController");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/add-product", isAuth, adminController.getAddProduct);

router.post("/product", isAuth, adminController.postAddProduct);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product/:productId",
  isAuth,
  adminController.postEditProduct
);

router.post(
  "/delete-product/:productId",
  isAuth,
  adminController.postDeleteProduct
);

module.exports = router;
