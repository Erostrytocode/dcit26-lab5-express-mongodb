const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Student = require("./models/Students");

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());


app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Student Records API is running",
  });
});

// Get all students
app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    return res.status(200).json(students);
  } catch (error) {
    console.error("GET /api/students failed:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/api/students/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json(student);
  } catch (error) {
    console.error("GET /api/students/:id failed:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});


app.post("/api/students", async (req, res) => {
  try {
    const student = new Student({
      fullName: req.body.fullName,
      course: req.body.course,
      yearLevel: req.body.yearLevel,
      section: req.body.section,
    });

    const savedStudent = await student.save();
    return res.status(201).json(savedStudent);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Invalid student data", errors: error.errors || undefined });
    }
    if (error instanceof SyntaxError && "body" in error) {
      return res.status(400).json({ message: "Malformed JSON request body" });
    }
    console.error("POST /api/students failed:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});


app.put("/api/students/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        fullName: req.body.fullName,
        course: req.body.course,
        yearLevel: req.body.yearLevel,
        section: req.body.section,
      },
      {
        new: true,
        runValidators: true,
        omitUndefined: true,
      }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json(student);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Invalid student data", errors: error.errors || undefined });
    }
    console.error("PUT /api/students/:id failed:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});


app.delete("/api/students/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({
      message: "Student deleted successfully",
      deletedStudent: student,
    });
  } catch (error) {
    console.error("DELETE /api/students/:id failed:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});


app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Malformed JSON request body" });
  }
  return next(error);
});


app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is missing. Add it to your .env file.");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Student Records API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not start server:", error.message);
    process.exit(1);
  }
}

startServer();