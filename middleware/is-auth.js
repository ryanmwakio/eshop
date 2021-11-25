module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    req.flash("message", "login before you proceed.");
    return res.redirect("/login");
  } else {
    return next();
  }
};
