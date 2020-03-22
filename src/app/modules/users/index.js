import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import { UserInputError } from 'apollo-server';

import UserModel from '../../models/User';
import authConf from '../../../config/auth';

import { getYupErrorMessages, formatErrorMessages } from '../../../utils/hooks';

const generateToken = ({ _id, email, username }) => {
  const { secret, expiresIn } = authConf;

  return jwt.sign(
    {
      _id,
      email,
      username,
    },
    secret,
    { expiresIn }
  );
};

export default {
  Mutation: {
    async login(_, { username, password }) {
      const schema = Yup.object().shape({
        username: Yup.string().required('Username must not be empity'),
        password: Yup.string().required('Password must not be empty'),
      });
      await schema
        .validate({ username, password }, { abortEarly: false })
        .catch(err => {
          const errors = getYupErrorMessages(err);
          throw new UserInputError('Errors', { errors });
        });

      const user = await UserModel.findOne({
        $or: [{ username }, { email: username }],
      });

      if (!user) {
        const error = [];
        error.push(formatErrorMessages('', 'User or password not found'));
        throw new UserInputError('Wrong crendetials', { errors: error });
      }
      const { _id, password: passwordHash } = user;

      const passwordMatch = bcrypt.compare(password, passwordHash);

      if (!passwordMatch) {
        const error = [];
        error.push(formatErrorMessages('', 'User or password not found'));
        throw new UserInputError('Wrong crendetials', { errors: error });
      }

      const token = generateToken(user);
      return {
        id: _id,
        ...user._doc,
        token,
      };
    },
    async createUser(_, { registerInput }) {
      const { username, email, password, confirmPassword } = registerInput;

      const schema = Yup.object().shape({
        username: Yup.string().required('Username must not be empty'),
        email: Yup.string()
          .email('Email must be a valid email address')
          .required('Email must not be empty'),
        password: Yup.string().required('Password must not be empty'),
        confirmPassword: Yup.string().oneOf(
          [Yup.ref('password'), null],
          'Passwords must match'
        ),
      });

      await schema
        .validate(
          { username, email, password, confirmPassword },
          { abortEarly: false }
        )
        .catch(err => {
          const errors = getYupErrorMessages(err);
          throw new UserInputError('Errors', { errors });
        });

      const userExist = await UserModel.findOne({
        $or: [{ username }, { email }],
      });

      if (userExist) {
        const error = [];

        if (userExist.username === username) {
          error.push(formatErrorMessages('username', 'Username already exist'));
        }

        if (userExist.email === email) {
          error.push(formatErrorMessages('email', 'Email already exist'));
        }

        throw new UserInputError('Errors', {
          errors: error,
        });
      }

      const newUser = new UserModel({
        email,
        username,
        password,
      });

      const userSaved = await newUser.save();

      const token = generateToken(userSaved);

      return {
        id: userSaved._id,
        ...userSaved._doc,
        token,
      };
    },
  },
};
