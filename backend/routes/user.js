const express = require("express");
const bcrypt = require("bcrypt");  
const jwt = require("jsonwebtoken");


const router = express.Router();  
const user = require("../models/user");  




router.post("/signup", (req, res, next) => {
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const NewUser = user({
        email: req.body.email,
        password: hash
      });

      return NewUser.save();
    })
    .then(result => {
      res.status(201).json({
        message: "User Created",
        result: result
      });
    })
    .catch(err => {
      res.status(500).json({
        message: "Invalid Authentication Credentials!"
      });
    });
});



router.post("/login", (req, res, next) => {
  user.findOne({ email: req.body.email })
    .then(user1 => {
      if (!user1) {
        return res.status(401).json({ message: "Invalid Authentication Credentials!" });
      }

      return bcrypt.compare(req.body.password, user1.password)
        .then(result => {
          if (!result) {
            return res.status(401).json({ message: "Invalid Authentication Credentials!" });
          }

          const token = jwt.sign(
            { email: user1.email, userId: user1._id },
            "A_very_long_string_for_our_secret",
            { expiresIn: "1h" }
          );

          res.status(200).json({
            token: token,
            expiresIn: 3600,
            userId: user1._id
          });
        });
    })
    .catch(err => {
      return res.status(401).json({ message: "Invalid Authentication Credentials!" });
    });
});


module.exports = router;  





