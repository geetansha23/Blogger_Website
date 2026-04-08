require("dotenv").config();

const cors = require("cors");
const connectDB = require("./config/db");
const app = require("./app");

// Connect to Database
connectDB();
app.use(cors());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});