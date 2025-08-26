const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");

// Send OTP For Email Verification
exports.sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user is already present
    // Find user with provided email
    // const checkUserPresent = await User.findOne({ email });
    // // to be used in case of signup

    // // If user found with provided email
    // if (!checkUserPresent) {
    //   // Return 401 Unauthorized status code with error message
    //   return res.status(401).json({
    //     success: false,
    //     message: `User is not Registered`,
    //   });
    // }

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

// verify otp with new email and replace email with old one controller for authenticating users
exports.verifyEmailOtp = async (req, res) => {
  try {
    // Destructure fields from the request body
    const { oldEmail, newEmail, otp } = req.body;
    // Check if All Details are there or not
    if (!oldEmail || !newEmail || !otp) {
      return res.status(403).send({
        success: false,
        message: "All Fields are required",
      });
    }

    // Find user with provided email
    const user = await User.findOne({ email: oldEmail });

    // If user not found with provided email
    if (!user) {
      // Return 401 Unauthorized status code with error message
      return res.status(401).json({
        success: false,
        message: `User is not Registered with Us Please SignUp to Continue`,
      });
    }
    // Find the most recent OTP for the email
    const response = await OTP.find({ email:newEmail })
      .sort({ createdAt: -1 })
      .limit(1);
    // console.log(response);
    if (response.length === 0) {
      // OTP not found for the email
      return res.status(400).json({
        success: false,
        message: "The OTP is not found",
      });
    } else if (otp !== response[0].otp) {
      // Invalid OTP
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      });
    }

    user.email = newEmail;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email updated successfully",
      updatedUser: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Verification Failure Please Try Again",
    });
  }
};
