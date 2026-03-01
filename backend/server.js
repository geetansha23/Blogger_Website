require("dotenv").config({ path: __dirname + "/../.env" });

const connectDB = require("./config/db");
const app = require("./app");

connectDB();
// console.log("All env:", process.env.MONGO_URI);

const PORT =  5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
