exports.error500 = (req, res, next) => {
  res.render("500", {
    title: "server error",
    path: "/500",
    isAuthenticated: req.session.isLoggedIn,
  });
};
