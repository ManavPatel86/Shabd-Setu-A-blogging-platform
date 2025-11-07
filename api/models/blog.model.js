import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    categories: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category'
            }
        ],
        required: true,
        default: []
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    blogContent: {
        type: String,
        required: true,
        trim: true
    },
    featuredImage: {
        type: String,
        required: true,
        trim: true
    },
    summary: {
        type: String,
        trim: true,
        default: ''
    },
    summaryRefreshCounts: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            count: {
                type: Number,
                default: 0,
                min: 0,
            }
        }
    ],
    views: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

const Blog = mongoose.model('Blog', blogSchema, 'blogs')
export default Blog 