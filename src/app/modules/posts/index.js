import * as Yup from 'yup';
import { UserInputError, AuthenticationError } from 'apollo-server';

import { getYupErrorMessages } from '../../../utils/hooks';

import PostModel from '../../models/Post';
import checkAuth from '../../middlewares/auth';

const POST_ADDED = 'NEW_POST';

export default {
  Query: {
    async getPosts(_, { body }, context) {
      try {
        // await checkAuth(context);

        const posts = await PostModel.find().sort({ createdAt: -1 });
        return posts;
      } catch (err) {
        throw new Error(err);
      }
    },
    async getPost(_, { postId }, context) {
      try {
        const post = await PostModel.findById(postId);

        return post || context.res.json({ error: 'Post not found' });
      } catch (err) {
        return context.res.json({ error: 'Post not found' });
        // throw new Error(err);
      }
    },
  },
  Mutation: {
    async createPost(_, { body }, context) {
      const user = await checkAuth(context);
      const schema = Yup.object().shape({
        body: Yup.string().required('Message must not be empty!'),
      });

      await schema.validate({ body }, { abortEarly: false }).catch(err => {
        const errors = getYupErrorMessages(err);
        throw new UserInputError('Errors', { errors });
      });

      const newPost = new PostModel({
        body,
        user: user.id,
        username: user.username,
        comments: [],
        likes: [],
      });

      const post = await newPost.save();

      context.pubsub.publish(POST_ADDED, {
        newPost: post,
      });

      return post;
    },

    async deletePost(_, { postId }, context) {
      const user = await checkAuth(context);

      try {
        const post = await PostModel.findById(postId);

        if (!post) {
          return context.res.json({ error: 'Post not found' });
        }

        if (user.username === post.username) {
          await post.delete();
          return 'Post deleted successfully';
        }

        throw new AuthenticationError('Action not allowed');
      } catch (error) {
        throw new Error(err);
      }
    },
    async likePost(_, { postId }, context) {
      const { username } = await checkAuth(context);

      const post = await PostModel.findById(postId);

      if (post) {
        if (post.likes.find(like => like.username === username)) {
          // unlike post
          post.likes = post.likes.filter(like => like.username !== username);
        } else {
          post.likes.push({
            username,
            createdAt: new Date().toISOString(),
          });
        }

        await post.save();
        return post;
      }
      return context.res.json({ error: 'Post not found' });
    },
  },
  Subscription: {
    newPost: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator([POST_ADDED]),
    },
  },
};
