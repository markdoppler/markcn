const express = require('express');
const app = express();

// Iniciar el servidor
const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = { app };