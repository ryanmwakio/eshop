const express = require("express");

const authController = require("../controllers/authController");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/login", authController.getLogin);

router.post("/login", authController.postLogin);

router.post("/logout", isAuth, authController.postLogout);

router.get("/register", authController.getRegister);

router.post("/register", authController.postRegister);

module.exports = router;
