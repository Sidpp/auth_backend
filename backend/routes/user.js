// Import the required modules
const express = require("express")
const { signin, sendotp, register, getUserDetails, getAllUsers, deleteUser, editUser, changePassword, updateBasicInfo, updateImage } = require("../controllers/AuthController")
const { resetPasswordToken, resetPassword } = require("../controllers/resetPasswordController")
const router = express.Router()
const {auth, isAdmin} = require("../middleware/auth")
const { sendEmailOtp, verifyEmailOtp } = require("../controllers/resetEmailAddress")

//Route for Email verification
// Route for sending otp for email verification
router.post("/sendotp-email", sendEmailOtp)
// Route for resetting user's emailemail after verification
router.post("/verifyotp-email", verifyEmailOtp)

// Routes for Login, Signup, and Authentication

//get user details
router.get("/get-user-details",auth,getUserDetails);

//get all user details
router.get("/get-all-user-details",auth,isAdmin,getAllUsers)

// Edit User Details
router.put("/edit-user/:userId", auth, isAdmin, editUser);

// Delete User
router.delete("/delete-user/:userId", auth, isAdmin, deleteUser);

// Route for user login
router.post("/signin", signin)

// Route for user signup
router.post("/register",auth,isAdmin, register)

// Route for user signup
router.post("/signup", register)

// Route for sending OTP to the user's email
router.post("/sendotp", sendotp)

// // Route for Changing the password
router.put("/change-password",auth,changePassword)

//Profile image
router.put("/update-image",auth,updateImage)

//update basic name, email
router.put("/update-info",auth,updateBasicInfo);

// Route for generating a reset password token
router.post("/reset-password-token", resetPasswordToken)

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword)


module.exports = router