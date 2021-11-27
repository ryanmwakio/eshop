const express = require("express");
const { check } = require("express-validator");

const authController = require("../controllers/authController");
const isAuth = require("../middleware/is-auth");

const router = express.Router();

router.get("/login", authController.getLogin);

router.post(
  "/login",
  [check("email").isEmail().withMessage("enter a valid email")],
  authController.postLogin
);

router.post("/logout", isAuth, authController.postLogout);

router.get("/register", authController.getRegister);

router.post(
  "/register",
  [
    check("email")
      .isEmail()
      .normalizeEmail()
      .trim()
      .withMessage("enter a valid email"),
    check("password")
      .isLength({ min: 8 })
      .withMessage(
        "password should be a minimum of 8 characters with a mixture of charcters,numbers and symbols"
      ),
    check("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("passwords have to match.");
      }
      return true;
    }),
  ],
  authController.postRegister
);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;
