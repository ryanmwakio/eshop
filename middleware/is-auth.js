module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    req.flash(
      "message",
      "login before you proceed.If you do not have an account then signup."
    );
    return res.redirect("/login");
  } else {
    return next();
  }
};
