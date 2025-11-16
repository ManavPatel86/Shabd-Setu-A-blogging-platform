import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin'],
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'banned', 'blocked'],
        default: 'active',
        trim: true
    },
    isBlacklisted: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    bio: {
        type: String,
        trim: true
    },
    avatar: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        trim: true
    },
    savedBlogs: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Blog'
        }],
        default: []
    },
    isBlacklisted: {
        type: Boolean,
        default: false
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    }
})

const User = mongoose.model('User', userSchema, 'users')
export default User 