import mongoose from "mongoose";

const viewSchema = new mongoose.Schema(
  {
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure that a user can only view a blog once
viewSchema.index({ blogId: 1, userId: 1 }, { unique: true });

const View = mongoose.model("View", viewSchema);
export default View;