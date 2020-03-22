import App from './app';

const port = 4000;

App.listen({ port }, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
