const shopController = require("../controllers/shopController");

const express = require("express");

const router = express.Router();

router.get("/", shopController.getAllProducts);

router.get("/get-product/:productId", shopController.getProduct);

router.get("/cart", shopController.getCart);

router.get("/add-cart/:productId", shopController.postCart);

router.get("/remove-cart/:productId", shopController.getRemoveFromCart);

router.get("/create-order", shopController.postOrder);

router.get("/orders", shopController.getOrders);

router.get("/clear-orders", shopController.clearOrders);

module.exports = router;
