const User = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const user = require("../models/user");
const cloudinary = require("cloudinary").v2;
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const nodemailer = require("nodemailer");
const otpStore = {};
const passwordResetOtpStore = {};

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage });

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET_KEY);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

router.post("/send-otp", async (req, res) => {
  console.log("SEND OTP BODY:", req.body);
  console.log("EMAIL USER:", process.env.EMAIL_USER);
  const { email } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    };

    console.log("START OTP");
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Email Verification OTP",
      html: `<p>Your OTP is <b>${otp}</b>. It will expire in 5 minutes.</p>`,
    });

    res.status(200).json({
      success: true,
      msg: "OTP sent to email",
    });
  } catch (error) {
    console.error("🔥 BACKEND ERROR:", error);
    res.status(500).json({ msg: error.message });
  }
});

router.post("/signup", async (req, res) => {
  const { name, phone, email, password, otp } = req.body;

  try {
    const storedOtp = otpStore[email];

    if (!storedOtp) {
      return res.status(400).json({ msg: "OTP not requested" });
    }

    if (storedOtp.expires < Date.now()) {
      return res.status(400).json({ msg: "OTP expired" });
    }

    if (storedOtp.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP" });
    }

    delete otpStore[email];

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ msg: "Email already in use" });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({ msg: "Phone already in use" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      phone,
      email,
      password: hashedPassword,
      isVerified: true,
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JSON_WEB_TOKEN_SECRET_KEY,
      { expiresIn: "7d" },
    );

    const userWithoutPassword = await User.findById(newUser._id).select(
      "-password",
    );

    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("🔥 BACKEND ERROR:", error);
    res.status(500).json({ msg: error.message });
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    const matchPassword = await bcrypt.compare(password, existingUser.password);

    if (!matchPassword) {
      return res
        .status(400)
        .json({ status: false, msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: existingUser._id, email: existingUser.email },
      process.env.JSON_WEB_TOKEN_SECRET_KEY,
      { expiresIn: "7d" },
    );

    const userWithoutPassword = await User.findById(existingUser._id).select(
      "-password",
    );

    res.status(200).json({
      user: userWithoutPassword,
      token,
      msg: "User Authenticated",
    });
  } catch (error) {
    res.status(500).json({ status: false, msg: error.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  const userList = await User.find().select("-password");
  res.send(userList);
});

router.get("/:id", authMiddleware, async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).send(user);
});

router.put("/:id", authMiddleware, async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ message: "Unauthorized action" });
  }

  const { name, phone, email, password } = req.body;

  const userExist = await User.findById(req.params.id);
  if (!userExist) {
    return res.status(404).json({ message: "User not found" });
  }

  let newPassword = userExist.password;

  if (password) {
    newPassword = await bcrypt.hash(password, 10);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name,
      phone,
      email,
      password: newPassword,
    },
    { new: true },
  ).select("-password");

  res.send(user);
});

router.post("/authWithGoogle", async (req, res) => {
  const { name, phone, email, images, isAdmin } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        phone,
        email,
        images,
        isAdmin: isAdmin || false,
        password: null,
      });
    }

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      success: true,
      user,
      token,
      msg: "User Login Successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
});

router.put(
  "/profile-image/:id",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (req.user.id !== req.params.id) {
        return res.status(403).json({ message: "Unauthorized action" });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      // delete old image
      if (user.profileImage?.public_id) {
        await cloudinary.uploader.destroy(user.profileImage.public_id);
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "users/profile",
      });

      fs.unlinkSync(req.file.path);

      user.profileImage = {
        url: result.secure_url,
        public_id: result.public_id,
      };

      await user.save();

      res.status(200).json({
        success: true,
        profileImage: user.profileImage,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

router.put("/change-password/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { oldPassword, newPassword } = req.body;

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ message: "Unauthorized action" });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.profileImage?.public_id) {
    await cloudinary.uploader.destroy(user.profileImage.public_id);
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({ success: true, message: "User deleted" });
});

router.post("/forgot-password/send-otp", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "Email not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    passwordResetOtpStore[email] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    };

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    res.status(200).json({ success: true, msg: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.post("/forgot-password/verify-otp", async (req, res) => {
  const { email, otp, newPassword, checkOnly } = req.body;

  try {
    const storedOtp = passwordResetOtpStore[email];

    if (!storedOtp) {
      return res.status(400).json({ success: false, msg: "OTP not requested" });
    }

    if (storedOtp.expires < Date.now()) {
      delete passwordResetOtpStore[email];
      return res.status(400).json({ success: false, msg: "OTP expired" });
    }

    if (storedOtp.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, msg: "Invalid OTP" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    if (checkOnly) {
      return res.status(200).json({ success: true, msg: "OTP verified" });
    }

    if (!newPassword) {
      return res
        .status(400)
        .json({ success: false, msg: "New password is required" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    delete passwordResetOtpStore[email];

    res
      .status(200)
      .json({ success: true, msg: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
});

module.exports = router;
