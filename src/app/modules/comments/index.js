import * as Yup from 'yup';

import checkAuth from '../../middlewares/auth';
import PostModel from '../../models/Post';

export default {
  Mutation: {
    async createComment(_, { postId, body }, context) {
      const { username } = await checkAuth(context);

      const schema = Yup.object().shape({
        body: Yup.string().required(),
      });

      if (!schema.isValid({ body })) {
        return context.res.json({ error: 'Comment body must not be empity' });
      }

      const post = await PostModel.findById(postId);

      if (post) {
        post.comments.unshift({
          body,
          username,
          createdAt: new Date().toISOString(),
        });

        await post.save();
        return post;
      }
      return context.res.json({ error: 'Post not found' });
    },
    async deleteComment(_, { postId, commentId }, context) {
      await checkAuth(context);
      const post = await PostModel.findById(postId);

      if (post && post.comments.length > 0) {
        const filteredComments = post.comments.filter(comment => {
          return comment._id.toString() !== commentId;
        });
        post.comments = await Promise.all(filteredComments);

        await post.save();

        return post;
      }
      return context.res.json({ error: 'Post not found' });
    },
  },
};
