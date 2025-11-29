import mongoose from "mongoose";

export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

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
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 20,
        match: USERNAME_REGEX,
    },
    name: {
        type: String,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    bio: {
        type: String,
        trim: true,
        default: ''
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
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema, 'users')
export default User 