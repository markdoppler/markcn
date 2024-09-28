import express from 'express';
const app = express();

// Iniciar el servidor
const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export { app };