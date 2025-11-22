import mongoose from "mongoose";
import Blog from "./models/blog.model.js";
import Comment from "./models/comment.model.js";
import { faker } from "@faker-js/faker";

await mongoose.connect("mongodb://localhost:27017/blogtest");

for (let i = 0; i < 10000; i++) {
  const blog = await Blog.create({
    author: faker.database.mongodbObjectId(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(5),
  });

  let comments = [];
  for (let j = 0; j < 50; j++) {
    comments.push({
      blogid: blog._id,
      text: faker.lorem.sentence(),
      user: faker.database.mongodbObjectId(),
    });
  }
  await Comment.insertMany(comments);
}

console.log("Done!!");
process.exit();
