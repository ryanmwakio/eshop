const bcrypt = require("bcryptjs");

const User = require("../models/User");

exports.getLogin = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    res.render("auth/login", {
      path: "/login",
      title: "Login",
      isAuthenticated: req.session.isLoggedIn,
    });
  }
};

exports.postLogin = (req, res, next) => {
  let email = req.body.email;
  let password = req.body.password;

  User.findOne({ email: email }).then((user) => {
    if (!user) {
      res.redirect("/login");
    } else {
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (!doMatch) {
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
  if (req.session.isLoggedIn) {
    req.session.destroy();
    req.session = null;
    res.redirect("/");
  }
};

exports.getRegister = (req, res, next) => {
  res.render("auth/register", {
    path: "/register",
    isAuthenticated: req.session.isLoggedIn,
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
            res.redirect("/login");
          });
        });
      }
    })
    .catch((err) => {
      console.error(err);
    });
};
