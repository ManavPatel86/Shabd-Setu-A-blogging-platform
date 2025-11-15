import { createNotification } from './createNotification.js';
import User from '../models/user.model.js';
import Blog from '../models/blog.model.js';
import Follow from '../models/follow.model.js';
import Category from '../models/category.model.js';

const buildBlogLink = (blog) => {
  if (!blog) {
    return '#';
  }

  const categories = Array.isArray(blog.categories) ? blog.categories : [];
  const primaryCategory = categories.find((category) => Boolean(category?.slug));

  if (primaryCategory?.slug) {
    return `/blog/${primaryCategory.slug}/${blog.slug}`;
  }

  return `/blog/${blog.slug}`;
};

export async function notifyLike({ likerId, blogId }) {
  const blog = await Blog.findById(blogId).populate([
    { path: 'author', select: 'name' },
    { path: 'categories', select: 'slug' },
  ]);
  if (!blog) return;
  if (String(blog.author._id) === String(likerId)) return; 

  const sender = await User.findById(likerId);
  await createNotification({
    recipientId: blog.author._id,
    senderId: likerId,
    type: 'like',
    link: buildBlogLink(blog),
    extra: { senderName: sender?.name || 'Someone', blogTitle: blog.title }
  });
}

export async function notifyComment({ commenterId, blogId }) {
  const blog = await Blog.findById(blogId).populate([
    { path: 'author', select: 'name' },
    { path: 'categories', select: 'slug' },
  ]);
  if (!blog) return;
  if (String(blog.author._id) === String(commenterId)) return;

  const sender = await User.findById(commenterId);
  await createNotification({
    recipientId: blog.author._id,
    senderId: commenterId,
    type: 'comment',
    link: `${buildBlogLink(blog)}#comments`,
    extra: { senderName: sender?.name || 'Someone', blogTitle: blog.title }
  });
}

export async function notifyReply({ replierId, originalCommentUserId, blogId }) {
  if (String(originalCommentUserId) === String(replierId)) return;
  const sender = await User.findById(replierId);
  const blog = await Blog.findById(blogId).populate([
    { path: 'categories', select: 'slug' },
  ]);
  await createNotification({
    recipientId: originalCommentUserId,
    senderId: replierId,
    type: 'reply',
    link: `${buildBlogLink(blog)}#comments`,
    extra: { senderName: sender?.name || 'Someone' }
  });
}

export async function notifyFollow({ followerId, targetUserId }) {
  if (String(followerId) === String(targetUserId)) return;
  const sender = await User.findById(followerId);
  await createNotification({
    recipientId: targetUserId,
    senderId: followerId,
    type: 'follow',
    link: `/profile/${followerId}`,
    extra: { senderName: sender?.name || 'Someone' }
  });
}

export async function notifyFollowersNewPost({ authorId, blogId }) {
  const author = await User.findById(authorId);
  const blog = await Blog.findById(blogId).populate([
    { path: 'categories', select: 'slug' },
  ]);
  if (!author || !blog) return;

  const follows = await Follow.find({ followingId: authorId });
  const followerIds = follows.map(follow => follow.followerId);

  for (const followerId of followerIds) {
    await createNotification({
      recipientId: followerId,
      senderId: authorId,
      type: 'newPost',
      link: buildBlogLink(blog),
      extra: { senderName: author.name || 'Someone', blogTitle: blog.title }
    });
  }
}
