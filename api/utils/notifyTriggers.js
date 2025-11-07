import { createNotification } from './createNotification.js';
import User from '../models/user.model.js';
import Blog from '../models/blog.model.js';
import Comment from '../models/comment.model.js';
import Follow from '../models/follow.model.js';
import BlogLike from '../models/bloglike.model.js';

export async function notifyLike({ likerId, blogId }) {
  const blog = await Blog.findById(blogId).populate('author');
  if (!blog) return;
  if (String(blog.author._id) === String(likerId)) return; 

  const sender = await User.findById(likerId);
  await createNotification({
    recipientId: blog.author._id,
    senderId: likerId,
    type: 'like',
    link: `/blog/${blogId}`,
    extra: { senderName: sender?.name || 'Someone', blogTitle: blog.title }
  });
}

export async function notifyComment({ commenterId, blogId }) {
  const blog = await Blog.findById(blogId).populate('author');
  if (!blog) return;
  if (String(blog.author._id) === String(commenterId)) return;

  const sender = await User.findById(commenterId);
  await createNotification({
    recipientId: blog.author._id,
    senderId: commenterId,
    type: 'comment',
    link: `/blog/${blogId}#comments`,
    extra: { senderName: sender?.name || 'Someone', blogTitle: blog.title }
  });
}

export async function notifyReply({ replierId, originalCommentUserId, blogId }) {
  if (String(originalCommentUserId) === String(replierId)) return;
  const sender = await User.findById(replierId);
  await createNotification({
    recipientId: originalCommentUserId,
    senderId: replierId,
    type: 'reply',
    link: `/blog/${blogId}#comments`,
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
  const blog = await Blog.findById(blogId);
  if (!author || !blog) return;

  const follows = await Follow.find({ followingId: authorId });
  const followerIds = follows.map(follow => follow.followerId);

  for (const followerId of followerIds) {
    await createNotification({
      recipientId: followerId,
      senderId: authorId,
      type: 'newPost',
      link: `/blog/${blogId}`,
      extra: { senderName: author.name || 'Someone', blogTitle: blog.title }
    });
  }
}
