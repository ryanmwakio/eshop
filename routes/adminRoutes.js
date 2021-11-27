const express = require("express");
const { check } = require("express-validator");

const adminController = require("../controllers/adminController");
const isAuth = require("../middleware/is-auth");
const isAdmin = require("../middleware/is-admin");

const router = express.Router();

router.get("/add-product", isAuth, isAdmin, adminController.getAddProduct);

router.post(
  "/product",
  [
    check("title").isAlphanumeric().trim(),
    check("price").isInt().trim(),
    check("description").isAlphanumeric().trim(),
  ],
  isAuth,
  isAdmin,
  adminController.postAddProduct
);

router.get(
  "/edit-product/:productId",
  isAuth,
  isAdmin,
  adminController.getEditProduct
);

router.post(
  "/edit-product/:productId",
  isAuth,
  isAdmin,
  adminController.postEditProduct
);

router.post(
  "/delete-product/:productId",
  isAuth,
  isAdmin,
  adminController.postDeleteProduct
);

module.exports = router;
