module.exports = (req, res, next) => {
  if (!req.session.isLoggedIn) {
    req.flash("message", "login before you proceed.");
    return res.redirect("/login");
  } else {
    let role = Number(req.user.role);

    if (role === 1) {
      return next();
    } else {
      return res.redirect("/");
    }
  }
};
