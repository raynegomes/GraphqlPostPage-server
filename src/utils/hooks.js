export const formatErrorMessages = (path, message) => {
  return {
    path,
    message,
  };
};

export const getYupErrorMessages = ({ inner }) => {
  return inner.map(({ path, errors }) => {
    return formatErrorMessages(path, errors[0]);
  });
};
