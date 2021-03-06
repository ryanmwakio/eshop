const crypto = require("crypto");

const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

const User = require("../models/User");
const serverError = require("../middleware/server-error");

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
    oldInput: { email: "" },
  });
};

exports.postLogin = (req, res, next) => {
  let email = req.body.email;
  let password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      title: "Login",
      message: errors.array()[0].msg,
      oldInput: { email: email },
    });
  } else {
    User.findOne({ email: email })
      .then((user) => {
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

                req.session.save();

                res.status(422).redirect("/");
              }
            })
            .catch((err) => {
              res.redirect("/login");
            });
        }
      })
      .catch((err) => {
        serverError(err, next);
      });
  }
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
    oldInput: { name: "", email: "" },
  });
};

exports.postRegister = (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const role = 2;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/register", {
      path: "/register",
      message: errors.array()[0].msg,
      oldInput: { name: name, email: email },
    });
  }

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
            role: role,
            cart: { items: [] },
          });

          user
            .save()
            .then((user) => {
              req.session.isLoggedIn = true;
              req.session.user = user;

              req.session.save();
            })
            .then(() => {
              const transporter = nodemailer.createTransport({
                service: "hotmail",
                auth: {
                  user: `${process.env.HOTMAIL_EMAIL}`,
                  pass: `${process.env.HOTMAIL_PASS}`,
                },
              });

              const options = {
                from: `${process.env.HOTMAIL_EMAIL}`,
                to: email,
                subject: "eshop registration confimation",
                text: `Hello ${name} welcome to E-Shop, all shoping at your fingertips.`,
                html: `<table class="body-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
    <tbody>
        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
            <td class="container" width="600" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;" valign="top">
                <div class="content" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 20px;">
                    <table class="main" width="100%" cellpadding="0" cellspacing="0" itemprop="action" itemscope="" itemtype="http://schema.org/ConfirmAction" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; margin: 0; border: none;">
                        <tbody><tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;padding: 30px;border: 1px solid #6D28D9;border-radius: 7px; background-color: #fff;" valign="top">
                                <meta itemprop="name" content="Confirm Email" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                    <tbody><tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                        <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                            Please confirm your email address by clicking the link below.
                                        </td>
                                    </tr>
                                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                        <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                            We may need to send you critical information about our service and it is important that we have an accurate email address.
                                        </td>
                                    </tr>
                                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                        <td class="content-block" itemprop="handler" itemscope="" itemtype="http://schema.org/HttpActionHandler" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                            <a href=${process.env.HOST_URL} class="btn-primary" itemprop="url" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; color: #FFF; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #6D28D9; margin: 0; border-color: #6D28D9; border-style: solid; border-width: 8px 16px;">Confirm
                                                email address</a>
                                        </td>
                                    </tr>
                                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                        <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                            <b>Ryan Mwakio</b>
                                            <p>Software Developer</p>
                                        </td>
                                    </tr>

                                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                        <td class="content-block" style="text-align: center;font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0;" valign="top">
                                           &copy; 2022 eshop
                                        </td>
                                    </tr>
                                </tbody></table>
                            </td>
                        </tr>
                    </tbody></table>
                </div>
            </td>
        </tr>
    </tbody>
</table>`,
              };

              transporter.sendMail(options, function (err, info) {
                if (err) {
                  console.error(err);
                  return;
                }
                console.log("Sent: " + info.response);
              });
              res.redirect("/");
            });
        });
      }
    })
    .catch((err) => {
      serverError(err, next);
    });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("message");

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render("auth/reset", {
    title: "Reset Password",
    path: "/reset",
    message: message,
  });
};

exports.postReset = (req, res, next) => {
  let email = req.body.email;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          req.flash("message", "invalid email");
          res.redirect("/reset");
        } else {
          user.resetToken = token;
          user.resetTokenExpiration = Date.now() + 3600000;
          return user.save();
        }
      })
      .then((result) => {
        const transporter = nodemailer.createTransport({
          service: "hotmail",
          auth: {
            user: `${process.env.HOTMAIL_EMAIL}`,
            pass: `${process.env.HOTMAIL_PASS}`,
          },
        });

        const options = {
          from: `${process.env.HOTMAIL_EMAIL}`,
          to: email,
          subject: "eshop password reset",
          text: `Password reset email`,
          html: `<table class="body-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;" bgcolor="#f6f6f6">
    <tbody>
        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
            <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;" valign="top"></td>
            <td class="container" width="600" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;" valign="top">
                <div class="content" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 20px;">
                    <table class="main" width="100%" cellpadding="0" cellspacing="0" itemprop="action" itemscope="" itemtype="http://schema.org/ConfirmAction" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; margin: 0; border: none;">
                        <tbody><tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td class="content-wrap" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;padding: 30px;border: 1px solid #6D28D9;border-radius: 7px; background-color: #fff;" valign="top">
                                <meta itemprop="name" content="Confirm Email" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                <table width="100%" cellpadding="0" cellspacing="0" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                    <tbody>
                                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                        <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                            You may have forgotten your password but we got you. Click on the link below to reset.
                                        </td>
                                    </tr>
                                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                        <td class="content-block" itemprop="handler" itemscope="" itemtype="http://schema.org/HttpActionHandler" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                            <a href="${process.env.HOST_URL}/reset/${token}" class="btn-primary" itemprop="url" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; color: #FFF; text-decoration: none; line-height: 2em; font-weight: bold; text-align: center; cursor: pointer; display: inline-block; border-radius: 5px; text-transform: capitalize; background-color: #6D28D9; margin: 0; border-color: #6D28D9; border-style: solid; border-width: 8px 16px;">Reset Password</a>
                                        </td>
                                    </tr>
                                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                        <td class="content-block" style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;" valign="top">
                                            <b>Ryan Mwakio</b>
                                            <p>Software Developer</p>
                                        </td>
                                    </tr>

                                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                        <td class="content-block" style="text-align: center;font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0;" valign="top">
                                           &copy; 2022 eshop
                                        </td>
                                    </tr>
                                </tbody></table>
                            </td>
                        </tr>
                    </tbody></table>
                </div>
            </td>
        </tr>
    </tbody>
</table>`,
        };

        transporter.sendMail(options, function (err, info) {
          if (err) {
            console.error(err);
            return;
          }
          console.log("Sent: " + info.response);
        });

        req.flash("message", "please check your email for a reset link");
        res.redirect("/reset");
      })
      .catch((err) => {
        serverError(err, next);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;

  if (!token) {
    req.flash(
      "message",
      "invalid token,start the reset process from the form below."
    );
    res.redirect("/reset");
  } else {
    User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    })
      .then((user) => {
        if (!user) {
          res.redirect("/reset");
        } else {
          let message = req.flash("message");

          if (message.length > 0) {
            message = message[0];
          } else {
            message = null;
          }

          res.render("auth/new-password", {
            title: "New Password",
            path: "/reset",
            message: message,
            userId: user._id.toString(),
            passwordToken: token,
          });
        }
      })
      .catch((err) => {
        serverError(err, next);
      });
  }
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  let resetUser;

  User.findOne({ _id: userId, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      serverError(err, next);
    });
};
