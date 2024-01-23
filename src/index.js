require("dotenv").config();
const app = require("./server");

const port = process.env.PORT || 5173;

app.listen(port, () =>
  console.log(`Server is running on http://localhost:${port}✅`)
);
