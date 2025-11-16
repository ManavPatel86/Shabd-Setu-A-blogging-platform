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
        required: function () {
            return this.status === 'published'
        },
        default: []
    },
    title: {
        type: String,
        required: function () {
            return this.status === 'published'
        },
        trim: true,
        default: ''
    },
    slug: {
        type: String,
        required: function () {
            return this.status === 'published'
        },
        trim: true,
        default: ''
    },
    blogContent: {
        type: String,
        required: function () {
            return this.status === 'published'
        },
        trim: true,
        default: ''
    },
    featuredImage: {
        type: String,
        required: function () {
            return this.status === 'published'
        },
        trim: true,
        default: ''
    },
    summary: {
        type: String,
        trim: true,
        default: ''
    },
    description: {
        type: String,
        trim: true,
        maxlength: 300,
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
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published',
        index: true
    },
    publishedAt: {
        type: Date,
        default: null
    },
    views: {
        type: Number,
        default: 0
    },
    removed: {
        type: Boolean,
        default: false
    },
    removedAt: {
        type: Date
    },
    removedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true })

blogSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { status: 'published' } })

const Blog = mongoose.model('Blog', blogSchema, 'blogs')
export default Blog 