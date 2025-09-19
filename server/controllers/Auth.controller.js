import User from "../models/user.model.js"
import bcryptjs from 'bcryptjs'
export const Register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body
        const checkuser = await User.findOne({ email })
        if (checkuser) {
            // user already registered 
            next(handleError(409, 'User already registered.'))
        }

        const hashedPassword = bcryptjs.hashSync(password)
        // register user  
        const user = new User({
            name, email, password: hashedPassword
        })

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Registration successful.'
        })

    } catch (error) {
        next(handleError(500, error.message))
    }
}
export const Login = async (req,res) => {
    
}
