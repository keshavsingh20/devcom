import { body, validationResult } from 'express-validator';
// import User from '../Modals/User';

export function SignUp(){
    return [
        // body('email','Email is Required').isEmail().custom((email,{req})=>{
        //     return Consumer.findOne({email: email}).then(user =>{
        //         if(user){
        //             throw new Error('User Already Exists..');
        //         }
        //         else{
        //             return true;
        //         }
        //     })
        // }),
        // body('password', 'Password is Required').isAlphanumeric().isLength({min: 8, max: 20}).withMessage('Password must be between 8 and 20 characters.'),
        // body('confirmPassword').custom((confirmPassword,{req})=> {
        //     if(confirmPassword !== req.body.password){
        //         throw new Error('Password didn\'t match. Enter Password Correctly.');
        //     }
        //     else{
        //         return true;
        //     }
        // }),
        // body('username','Username is Required').isString()

      
            body('email').isEmail(),
            body('password').isLength({min: 6}),
            body('username').isLength({min:5})
    ]
}
