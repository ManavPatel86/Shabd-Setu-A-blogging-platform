import User from "../models/user.model.js"
import bcryptjs from 'bcryptjs'
import { handleError } from "../helpers/handleError.js";
export const Register = async (req, res, next) => {
    try {
        console.log(req.body);
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
      try {
        const { email, password } = req.body
        const user = await User.findOne({ email })
        if (!user) {
            next(handleError(404, 'Invalid login credentials.'))
        }
        const hashedPassword = user.password

        const comparePassword = bcryptjs.compare(password, hashedPassword)
        if (!comparePassword) {
            next(handleError(404, 'Invalid login credentials.'))
        }

        const token = jwt.sign({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
        }, process.env.JWT_SECRET)


        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            path: '/'
        })

        const newUser = user.toObject({ getters: true })
        delete newUser.password
        res.status(200).json({
            success: true,
            user: newUser,
            message: 'Login successful.'
        })

    } catch (error) {
        next(handleError(500, error.message))
    }
    
}
