var express = require('express');
var router = express.Router();
var path = require("path")
const { auth } = require('../lib/auth');

/* GET home page. */
router.get('/', auth, function(req, res, next) {
  res.sendFile(path.join(__dirname, "../views/index.html"));
});

router.get('/login', function(req, res, next) {
  res.sendFile(path.join(__dirname, "../views/members/login.html"));
});

router.get('/register', function(req, res, next) {
  res.sendFile(path.join(__dirname, "../views/members/register.html"))
});

router.get('/forgot_pw', function(req, res, next) {
  res.sendFile(path.join(__dirname, "../views/members/forgot_pw.html"))
});

router.get('/modify_profile', auth, function(req, res, next) {
  res.sendFile(path.join(__dirname, "../views/members/modify_profile.html"))
});

router.get('/dashboard', auth, function(req, res, next) {
  res.sendFile(path.join(__dirname, "../views/dashboard.html"))
});
router.get('/dashboard_premium', auth, function(req, res, next) {
  res.sendFile(path.join(__dirname, "../views/dashboard_premium.html"))
});
router.get('/chart', auth, function(req, res, next) {
  res.sendFile(path.join(__dirname, "../views/chart.html"))
});

router.get('/student_manage', auth, function(req, res, next) {
  if (req.user.level == 1 || req.user.level == 3) res.sendFile(path.join(__dirname, "../views/student_manage.html"))
});

router.get('/admin', auth, function(req, res, next) {
  if (req.user.level == 3 || req.user.level == 4) res.sendFile(path.join(__dirname, "../views/admin.html"))
});

module.exports = router;