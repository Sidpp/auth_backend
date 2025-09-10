const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const Credentials = require("../models/jiracredential");
const JiraIssue = require("../models/jiraissues");
const GoogleCredential = require("../models/googlecredentials");
const GoogleSheet = require("../models/googleSheet");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");

require("dotenv").config();

exports.deleteUserJiraCredential = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid or missing user_id" });
    }

    // 1️⃣ Find the user
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ Get the Jira credential linked to this user
    const credentialId = user.jira_credential_id;
    if (!credentialId) {
      return res
        .status(404)
        .json({ message: "No Jira credential found for this user" });
    }

    // 3️⃣ Remove only this user_id from credentials.userid array
    await Credentials.findByIdAndUpdate(
      credentialId,
      { $pull: { userid: user_id } }, // pull user from array
      { new: true }
    );

    // 4️⃣ Remove jira_credential_id from user safely
    await User.findByIdAndUpdate(
      user_id,
      { $unset: { jira_credential_id: "" } }, // cleanly remove field
      { new: true }
    );

    return res.status(200).json({
      message: "User unlinked from Jira credential successfully",
    });
  } catch (error) {
    console.error("Error unlinking user from Jira credential:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteUserGoogleCredential = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid or missing user_id" });
    }

    // 1️⃣ Find the user
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ Find the Google credential linked to this user
    const googleCredentialId = user.google_credential_id;
    if (!googleCredentialId) {
      return res
        .status(404)
        .json({ message: "No Google credential found for this user" });
    }

    // 3️⃣ Delete all GoogleSheet rows linked to this credential
    await GoogleSheet.deleteMany({ userId: user_id });

    // 4️⃣ Delete the Google credential itself
    await GoogleCredential.findByIdAndDelete(googleCredentialId);

    // 5️⃣ Remove the reference from the user
    user.google_credential_id = undefined;
    await user.save();

    return res.status(200).json({
      message: "Google credential and related sheets deleted for this user",
    });
  } catch (error) {
    console.error("Error deleting Google credential for user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get All Users (excluding passwords)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    // If no users found
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    // Return the user list
    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// Edit User Details by ID
exports.editUser = async (req, res) => {
  try {
    const { userId } = req.params; // user ID from URL params
    const {
      name,
      email,
      role,
      source,
      projectrole,
      assignJiraProjects,
      googleProjectAuthor,
      jiraProjectAuthor
    } = req.body; // fields to update

    if (!name && !email && !role && !projectrole) {
      return res.status(400).json({
        success: false,
        message: "At least one field (name, email, role) is required to update",
      });
    }

    // Update user (exclude password updates here)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name,
          email,
          role,
          source,
          projectrole,
          assignJiraProjects,
          googleProjectAuthor,
          jiraProjectAuthor
        },
      },
      { new: true, runValidators: true, select: "-password" }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User details updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating user details",
      error: error.message,
    });
  }
};

// Delete User by ID
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// Get user details using token
exports.getUserDetails = async (req, res) => {
  try {
    // req.user is populated by the auth middleware
    const userId = req.user.id;

    // Fetch the user data from the database, excluding the password
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching user details",
      error: error.message,
    });
  }
};

// Register Controller for Registering USers
exports.register = async (req, res) => {
  try {
    // Destructure fields from the request body
    const {
      name,
      email,
      password,
      source,
      confirmPassword,
      role,
      projectrole,
      assignJiraProjects,
      googleProjectAuthor,
      jiraProjectAuthor,
    } = req.body;

    // console.log(
    //   "data",
    //   name,
    //   email,
    //   password,
    //   source,
    //   confirmPassword,
    //   role,
    //   projectrole,
    //   assignJiraProjects,
    //   googleProjectAuthor,
    //   jiraProjectAuthor
    // );

    // Check if All Details are there or not
    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(403).send({
        success: false,
        message: "All Fields are required",
      });
    }

    // Check if password and confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and Confirm Password do not match. Please try again.",
      });
    }

    // Require source/projectrole if role = User
    if (source === "Jira") {
      if (!projectrole) {
        return res.status(403).json({
          success: false,
          message: "Project Role is required for Jira Platform",
        });
      }
      // if (!assignJiraProjects) {
      //   return res.status(403).json({
      //     success: false,
      //     message: "AssignJiraProjects is required for Jira Platform",
      //   });
      // }
      // if (!jiraProjectAuthor) {
      //   return res.status(403).json({
      //     success: false,
      //     message: "AssignJiraProjects is required for Jira Platform",
      //   });
      // }
    } else {
      if (!googleProjectAuthor) {
        return res.status(403).json({
          success: false,
          message: "googleProjectAuthor is required for Google Platform",
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please sign in to continue.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role,
      projectrole: projectrole || null,
      source: source || null,
      assignJiraProjects: assignJiraProjects || [],
      googleProjectAuthor: googleProjectAuthor || null,
      jiraProjectAuthor: jiraProjectAuthor || null,
    });

    return res.status(200).json({
      success: true,
      user,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    });
  }
};

// Login/Signin controller for authenticating users
exports.signin = async (req, res) => {
  try {
    // Destructure fields from the request body
    const { email, password, otp } = req.body;
    // Check if All Details are there or not
    if (!email || !password || !otp) {
      return res.status(403).send({
        success: false,
        message: "All Fields are required",
      });
    }

    // Find user with provided email
    const user = await User.findOne({ email });

    // If user not found with provided email
    if (!user) {
      // Return 401 Unauthorized status code with error message
      return res.status(401).json({
        success: false,
        message: `User is not Registered with Us Please SignUp to Continue`,
      });
    }
    // Find the most recent OTP for the email
    const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
    // console.log(response);
    if (response.length === 0) {
      // OTP not found for the email
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      });
    } else if (otp !== response[0].otp) {
      // Invalid OTP
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      });
    }

    // Generate JWT token and Compare Password
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        role: user.role,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "24hr",
      });

      // Save token to user document in database
      user.token = token;
      user.lastActive = new Date();
      await user.save();
      user.password = undefined;
      // Set cookie for token and return success response
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: `User Login Success`,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: `Password is incorrect`,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Login Failure Please Try Again",
    });
  }
};

// Send OTP For Email Verification
exports.sendotp = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user is already present
    // Find user with provided email
    const checkUserPresent = await User.findOne({ email });
    // to be used in case of signup

    // If user found with provided email
    if (!checkUserPresent) {
      // Return 401 Unauthorized status code with error message
      return res.status(401).json({
        success: false,
        message: `User is not Registered`,
      });
    }

    if (!(await bcrypt.compare(password, checkUserPresent.password))) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const result = await OTP.findOne({ otp: otp });
    // console.log("Result is Generate OTP Func");
    // console.log("OTP", otp);
    // console.log("Result", result);
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      });
    }
    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);
    //console.log("OTP Body", otpBody);

    res.status(200).json({
      success: true,
      message: `OTP Sent Successfully`,
      otp,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};

//Controller for Changing Password
exports.changePassword = async (req, res) => {
  try {
    // Get user data from req.user
    const userDetails = await User.findById(req.user.id);

    // Get old password, new password, and confirm new password from req.body
    const { oldPassword, newPassword } = req.body;

    // Validate old password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "The old password is incorrect" });
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    );

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.name}`
        )
      );
      console.log("Email sent successfully:", emailResponse.response);
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      });
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    });
  }
};

//update profile image
exports.updateImage = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );
    console.log(image);
    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    );
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//Update info
exports.updateBasicInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const updatedData = {};

    // Conditionally update name if it's non-empty
    if (req.body.name && req.body.name.trim() !== "") {
      updatedData.name = req.body.name.trim();
    }

    // Conditionally update email if it's non-empty
    if (req.body.email && req.body.email.trim() !== "") {
      updatedData.email = req.body.email.trim();
    }

    // If no valid fields provided
    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: "User profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
