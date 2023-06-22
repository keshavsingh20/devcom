import { Router } from "express";
import User from "../Modals/User.js";
import Post from '../Modals/Post.js'
import { body, validationResult } from "express-validator";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import verifyToken from "./VerifyToken.js";
import ResetToken from "../Modals/ResetToken.js";
import generateOTP from "./OTPgen/mail.js";
import VerificationToken from "../Modals/VerificationToken.js";
import nodemailer from 'nodemailer'
import crypto from 'crypto'
// import {SignUpContrlr} from'../controllers/UserController.js';
// import { SignUp } from '../validators/UserValidator.js';


const router = Router();
const JWTSEC = "#2@!@$ndja45883 r7##";


// user register api
router.post("/create/user",
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("username").isLength({ min: 5 }),
  body("phoneNo").isLength({ min: 10 }),
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json("Some Error Occured...!");
    }

    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res.status(200).json("Please login with correct password");
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      user = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        profile: req.body.profile,
        phoneNo: req.body.phoneNo,
        bio:'',
        title:''
      });

      const accessToken = jwt.sign({
        id: user._id,
        username: user.username,
      }, JWTSEC);

      // const OTP = generateOTP();
      // const verificationToken = await VerificationToken.create({
      //   user: user._id,
      //   token: OTP
      // });

      // verificationToken.save();
      await user.save();
      // const transport = nodemailer.createTransport({
      //   host: "sandbox.smtp.mailtrap.io",
      //   port: 2525,
      //   auth: {
      //     user: process.env.USER,
      //     pass: process.env.PASS
      //   }
      // });

      // transport.sendMail({
      //   from: "devcom@gmail.com",
      //   to: user.email,
      //   subject: "Verify Your Email Using OTP",
      //   html: `<h1>Your OTP CODE ${OTP} </h1>`
      // })

      res.status(200).json({ user, accessToken });
      // res.status(200).json({ status: "Pending", msg: "Please check your email", user: user._id });
    } catch (error) {
      console.log(error)
      return res.status(400).json("Internal error occured");
    }
  }
);


// verify email
router.post("/verify/email", async (req, res) => {
  const { user, OTP } = req.body;
  const mainUser = await User.findById(user);
  if (!mainUser) return res.status(400).json("User Not Found...!")

  if (mainUser.verified === true) {
    return res.status(400).json("User already verified...!")
  }

  const token = await VerificationToken.findOne({ user: mainUser._id });
  if (!token) return res.status(400).json("Sorry token not found...!")

  const isMatch = await bcrypt.compare(OTP, token.token)

  if (!isMatch) return res.status(400).json("Token is not valid...!");

  mainUser.verified = true;
  await VerificationToken.findByIdAndDelete({_id: token._id});
  await mainUser.save();

  const accessToken = jwt.sign({
    id: mainUser.id,
    username: mainUser.username,
  }, JWTSEC);

  const { password, ...other } = mainUser._doc;

  const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS
    }
  });
  transport.sendMail({
    from: "devcom@gmail.com",
    to: mainUser.email,
    subject: "Successfully Verified Email",
    html: `<h1>Congratulations You have Successfullly verified your email address.</h1><p>Now You can login into your account.</p>`
  })

  // res.status(200).json({ user, accessToken });
  res.status(200).json({ other, accessToken });

})



// user login api
router.post("/login",
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  // body("username").isLength({ min: 5 }),
  async (req, res) => {
    // const error = validationResult(req);
    // if (!error.isEmpty()) {
    //   return res.status(400).json("Some Error Occured...!");
    // }

    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(400).json("User Doesn't Exist In Our DataBase...! Please register yourself...!");
      }

      const comparePassword = await bcrypt.compare(req.body.password, user.password);
      if (!comparePassword) {
        return res.status(400).json("Your Password Is Not Correct...! Please Provide Correct Password...!");
      }

      const accessToken = jwt.sign({
        id: user._id,
        username: user.username,
      }, JWTSEC);
      const { password, ...other } = user._doc;

      res.status(200).json({ other, accessToken });
    }
    catch (error) {
      // console.log(error)
      res.status(500).json("Internal error occured...!");
    }
  })



// forgot password api
router.post("/forgot/password", async (req, res) => {
  const { email } = req.body
  const user = await User.findOne({ email: email })
  if (!user) return res.status(400).json("User Not Found...!")

  const token = await ResetToken.findOne({ user: user._id })
  if (token) {
    return res.status(400).json("After one hour you can request for another token...!")
  }

  const RandomTxt = crypto.randomBytes(20).toString('hex')
  const resetToken = new ResetToken({
    user: user._id,
    token: RandomTxt
  })
  await resetToken.save();

  const transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.USER,
      pass: process.env.PASS
    }
  });
  transport.sendMail({
    from: "devcom@gmail.com",
    to: user.email,
    subject: "Reset Token",
    html: `http://localhost:3000/reset/password?token=${RandomTxt}&_id=${user._id}`
  })

  return res.status(200).json("Check Your email to reset password...!")

})


// // reset password
router.put("/reset/password" , async(req , res)=>{
  const {token , _id} = req.query;
  if(!token || !_id){
      return res.status(400).json("Invalid req");
  }
  const user = await User.findOne({_id:_id});
  if(!user){
      return res.status(400).json("user not found")
  }
  const resetToken = await ResetToken.findOne({user:user._id});
  if(!resetToken){
      return res.status(400).json("Reset token is not found")
  }
  // console.log(resetToken.token)
  const isMatch = await bcrypt.compareSync(token , resetToken.token);
  if(!isMatch){
      return res.status(400).json("Token is not valid");
  }

  const {password} = req.body;
  // const salt = await bcrypt.getSalt(10);
  const secpass = await bcrypt.hash(password , 10);
  user.password = secpass;
  await user.save();
  await ResetToken.findOneAndDelete({user:user._id})
  const transport = nodemailer.createTransport({
      host: "smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.USER,
        pass: process.env.PASS
      }
    });
    transport.sendMail({
      from:"sociaMedia@gmail.com",
      to:user.email,
      subject:"Your password reset successfully",
      html:`Now you can login with new password`
    })
    return res.status(200).json("Email has been send")

})


// api for following
router.put("/following/:id", verifyToken, async (req, res) => {
  if (req.params.id !== req.body.user) {
    const user = await User.findById(req.params.id);
    const otherUser = await User.findById(req.body.user)

    if (!user.followers.includes(req.body.user)) {
      await user.updateOne({ $push: { followers: req.body.user } })
      await otherUser.updateOne(({ $push: { following: req.params.id } }))
      return res.status(200).json("User has followed...!")
    }
    else {
      await user.updateOne({ $pull: { followers: req.body.user } })
      await otherUser.updateOne(({ $pull: { following: req.params.id } }))
      return res.status(200).json("User has unfollowed...!")
    }
  }
  else {
    return res.status(400).json("You can't follow yourself...!")
  }
})

router.put("/follower/remove/:id", verifyToken, async (req, res) => {
  if (req.params.id !== req.body.user) {
    const user = await User.findById(req.params.id);
    const otherUser = await User.findById(req.body.user)

      await user.updateOne({ $pull: { following: req.body.user } })
      await otherUser.updateOne(({ $pull: { followers: req.params.id } }))
      return res.status(200).json("User has removed...!")
  }
  else {
    return res.status(400).json("You can't remove yourself...!")
  }
})


// fetch post of followings (for show on feed)
// (i think two apis required here...one for follower and one for following)
// if we want to see posts from both follwers and followings 
// here we are going to implement for only followings (like instagram)
router.get("/flw/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    const followersPost = await Promise.all(
      user.following.map((item) => {
        return Post.find({ user: item })
      })
    )
    const userPost = await Post.find({ user: user._id });
    // console.log(user);
    // console.log(userPost)
    const allUserPosts = userPost.concat(...followersPost);
    let sortedPosts = allUserPosts.sort(
      (p1, p2) => (p1.updatedAt < p2.updatedAt) ? 1 : (p1.updatedAt > p2.updatedAt) ? -1 : 0);

    // return res.status(200).json(userPost.concat(...followersPost))
    // console.log(sortedPosts)
      return res.status(200).json(sortedPosts)
  } catch (error) {
    console.log(error)
    res.status(500).json("Internal server error occured...!");
  }
})

// update user profile data
router.put("/update/:id", verifyToken, async (req, res) => {
  try {
        const updateUser = await User.findByIdAndUpdate(req.params.id, req.body,{
           new:true,
           runValidators:true,
           useFindAndModify: false
        });
        await updateUser.save();
        res.status(200).json(updateUser);
  } catch (error) {
    console.log(error);
    return res.status(500).json("Internal server error occured...!")
  }
})

// delete user account 
router.delete("/delete/:id", async (req, res) => {
  try {
    // if (req.params.id !== req.user.id) {
    //   res.status(400).json("Account doesn't match...!");
    // }
    // else {
      await User.findByIdAndDelete(req.params.id)
      return res.status(200).json("User Account has been deleted successfully...!")
    // }
  } catch (error) {
    console.log(error);
    return res.status(500).json("Internal server error occured...!")
  }
})


// get user details for post
router.get("/post/user/details/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(400).json("User Not Found...!")
    }

    const { email, password, phoneNo, ...others } = user._doc;
    res.status(200).json(others);
  } catch (error) {
    console.log(error)
    return res.status(500).json('Internal server error occured...!')
  }

})


// get user to follow (suggestions)
router.get("/all/user/:id", async (req, res) => {
  try {
    const allUser = await User.find();
    const user = await User.findById(req.params.id);
    const followingUser = await Promise.all(
      user.following.map((item) => {
        return item;
      })
    )
    let UserToFollow = allUser.filter((val) => {
      return !followingUser.find((item) => {
        return val._id.toString() === item;
      })
    })

    let filteruser = await Promise.all(
      UserToFollow.map((item) => {
        const { email, phoneNo, followers, following, password, ...others } = item._doc;
        return others;
      })
    )
    return res.status(200).json(filteruser);
  } catch (error) {
    return res.status(500).json("Some Internal Error Occured...!")
  }
})


// get a following user
router.get("/following/:id" , async(req , res)=>{
  // try {
        const user = await User.findById(req.params.id);
        const followinguser = await Promise.all(
              user.following.map((item)=>{
                    return User.findById(item)
              })
        )

        let followingList=[];
        followinguser.map((person)=>{
              // const {email, password , phoneNo , following , followers , ...others} = person._doc;
              followingList.push(person);
        })

        res.status(200).json(followingList);
  // } catch (error) {
  //      return res.status(500).json("Internal server error")
  // }
})


// get a follower
router.get("/follower/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const followerUser = await Promise.all(
      user.followers.map((item) => {
        return User.findById(item)
      })
    )
    let followerList = [];
    followerUser.map((person) => {
      // const { email, password, phoneNo, following, followers, ...others } = person._doc;
      followerList.push(person);
    })

    return res.status(200).json(followerList)
  } catch (error) {
    console.log(error)
    return res.status(500).json("Some Internal Error Occured...!")
  }
})


export default router;



