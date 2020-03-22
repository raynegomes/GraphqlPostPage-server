import posts from './posts';
import users from './users';
import comments from './comments';

export default {
  Post: {
    likeCount: parent => {
      return parent.likes.length || 0;
    },
    commentCount: parent => {
      return parent.comments.length || 0;
    },
  },
  Query: {
    ...posts.Query,
  },
  Mutation: {
    ...users.Mutation,
    ...posts.Mutation,
    ...comments.Mutation,
  },
  Subscription: {
    ...posts.Subscription,
  },
};
