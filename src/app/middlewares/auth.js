import { AuthenticationError } from 'apollo-server';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import authConfig from '../../config/auth';

export default async context => {
  const authHeader = context.req.headers.authorization;

  const { secret } = authConfig;

  if (!authHeader) {
    return context.res.json({ error: 'access denied: user unauthorized' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const user = await promisify(jwt.verify)(token, secret);

    return user;
  } catch (error) {
    return context.res.json({ error: 'Invalid/Expired Token' });
  }
};
