const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const User = require("../models/User");

exports.getLogin = (req, res, next) => {
  let message = req.flash("message");

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/login", {
    path: "/login",
    title: "Login",
    message: message,
  });
};

exports.postLogin = (req, res, next) => {
  let email = req.body.email;
  let password = req.body.password;

  User.findOne({ email: email }).then((user) => {
    if (!user) {
      req.flash("message", "Invalid email or password");

      res.redirect("/login");
    } else {
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (!doMatch) {
            req.flash("message", "Invalid email or password");
            res.redirect("/login");
          } else {
            req.session.isLoggedIn = true;
            req.session.user = user;

            req.session.save((err) => {
              console.error(err);
            });

            res.redirect("/");
          }
        })
        .catch((err) => {
          console.error(err);
          res.redirect("/login");
        });
    }
  });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy();
  req.session = null;
  res.redirect("/");
};

exports.getRegister = (req, res, next) => {
  let message = req.flash("message");

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/register", {
    path: "/register",
    message: message,
  });
};

exports.postRegister = (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  User.find({ email: email })
    .then((userDoc) => {
      if (userDoc.length > 0) {
        req.flash("message", "sorry email already in use");
        res.redirect("/register");
      } else {
        return bcrypt.hash(password, 12).then((hashedPassword) => {
          const user = new User({
            name: name,
            email: email,
            password: hashedPassword,
            cart: { items: [] },
          });

          user.save().then(() => {
            const transporter = nodemailer.createTransport({
              service: "hotmail",
              auth: {
                user: "ryanmwakio6@outlook.com",
                pass: "HT7$gQ_k925",
              },
            });

            const options = {
              from: "ryanmwakio6@outlook.com",
              to: email,
              subject: "eshop registration confimation",
              text: `Hello ${name} welcome to E-Shop, all shoping at your fingertips.`,
            };

            transporter.sendMail(options, function (err, info) {
              if (err) {
                console.error(err);
                return;
              }
              console.log("Sent: " + info.response);
            });
            res.redirect("/login");
          });
        });
      }
    })
    .catch((err) => {
      console.error(err);
    });
};
