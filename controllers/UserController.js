import User from "../Modals/User.js";
import { body, validationResult, param } from "express-validator";

// export class UserController {

//     static async SignUp(req, res, next) {
//         console.log("hello");
//     }
// }

const SignUpContrlr = async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json("Some Error Occured...!")
    }

    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(200).json("Please login with correct password")
        }

        user = await User.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            profile: req.body.profile,
            phoneNo: req.body.phoneNo
        })

        await user.save();
        res.status(200).json(user);

    }
    catch (error) {
        return res.status(400).json('Internal error occured');
    }
}

// module.exports.SignUpContrlr = SignUpContrlr;
// export SignUpContrlr;
