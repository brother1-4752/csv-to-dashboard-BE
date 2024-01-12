const app = require("./server");
const port = 5173;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}✅`);
});
