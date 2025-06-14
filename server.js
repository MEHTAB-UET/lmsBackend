const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const session = require("express-session");
const { MongoClient, ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const app = express();

// MongoDB connection
const uri =
  "mongodb+srv://aliirtiza859:Irtizaali859.@irtizacluster.l7kp5.mongodb.net/lms_3";
const client = new MongoClient(uri);

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
      httpOnly: true,
    },
  })
);

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
};

// Connect to MongoDB
async function connectToMongo() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

connectToMongo();

// Profile endpoint to check session status
app.get("/api/profile", isAuthenticated, async (req, res) => {
  try {
    const db = client.db("lms_3");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.session.userId) },
      { projection: { password: 0 } } // Exclude password from response
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      program: user.program,
      semester: user.semester,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
});

// Auth endpoint (for login)
app.post("/api/auth", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", { email, password });

    const db = client.db("lms_3");
    const usersCollection = db.collection("users");

    // Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "User not found" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log("Invalid password for user:", email);
      return res.status(400).json({ message: "Invalid password" });
    }

    // Set session
    req.session.userId = user._id.toString(); // Convert ObjectId to string
    req.session.role = user.role; // Store role in session

    console.log("Login successful for:", email);
    res.json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        program: user.program,
        semester: user.semester,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// Register endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role, department, program, semester } =
      req.body;

    const db = client.db("lms_3");
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = {
      name,
      email,
      password: hashedPassword,
      role,
      department,
      program: program || "BS Computer Science",
      semester: semester || 1,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(user);
    user._id = result.insertedId;

    // Set session
    req.session.userId = user._id;

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
});

// Logout endpoint
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// Student Management Endpoints
// Get all students
app.get("/api/students", isAuthenticated, async (req, res) => {
  try {
    const db = client.db("lms_3");
    const students = await db
      .collection("users")
      .find({ role: "student" })
      .project({ password: 0 }) // Exclude password from response
      .toArray();
    res.json(students);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching students", error: error.message });
  }
});

// Get single student
app.get("/api/students/:id", isAuthenticated, async (req, res) => {
  try {
    const db = client.db("lms_3");
    const student = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(req.params.id), role: "student" },
        { projection: { password: 0 } }
      );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching student", error: error.message });
  }
});

// Add new student
app.post("/api/students", isAuthenticated, async (req, res) => {
  try {
    const { name, email, department, program, semester } = req.body;

    const db = client.db("lms_3");

    // Check if student already exists
    const existingStudent = await db.collection("users").findOne({ email });
    if (existingStudent) {
      return res
        .status(400)
        .json({ message: "Student with this email already exists" });
    }

    // Generate a temporary password (first 6 characters of email + "123")
    const tempPassword = email.substring(0, 6) + "123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const student = {
      name,
      email,
      password: hashedPassword,
      role: "student",
      department,
      program: program || "BS Computer Science",
      semester: semester || 1,
      createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(student);
    student._id = result.insertedId;
    delete student.password;

    res.status(201).json({
      message: "Student added successfully",
      student,
      tempPassword, // Send temporary password in response
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding student", error: error.message });
  }
});

// Update student
app.put("/api/students/:id", isAuthenticated, async (req, res) => {
  try {
    const { name, email, department, program, semester } = req.body;

    const db = client.db("lms_3");

    // Check if email is being changed and if it's already in use
    if (email) {
      const existingStudent = await db.collection("users").findOne({
        email,
        _id: { $ne: new ObjectId(req.params.id) },
      });
      if (existingStudent) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(department && { department }),
      ...(program && { program }),
      ...(semester && { semester }),
    };

    const result = await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(req.params.id), role: "student" },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating student", error: error.message });
  }
});

// Delete student
app.delete("/api/students/:id", isAuthenticated, async (req, res) => {
  try {
    const db = client.db("lms_3");
    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(req.params.id),
      role: "student",
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting student", error: error.message });
  }
});

// Faculty Management Endpoints
// Get all faculty members
app.get("/api/faculty", isAuthenticated, async (req, res) => {
  try {
    const db = client.db("lms_3");
    const faculty = await db
      .collection("users")
      .find({ role: "faculty" })
      .project({ password: 0 }) // Exclude password from response
      .toArray();
    res.json(faculty);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching faculty", error: error.message });
  }
});

// Get single faculty member
app.get("/api/faculty/:id", isAuthenticated, async (req, res) => {
  try {
    const db = client.db("lms_3");
    const faculty = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(req.params.id), role: "faculty" },
        { projection: { password: 0 } }
      );

    if (!faculty) {
      return res.status(404).json({ message: "Faculty member not found" });
    }

    res.json(faculty);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching faculty member", error: error.message });
  }
});

// Add new faculty member
app.post("/api/faculty", isAuthenticated, async (req, res) => {
  try {
    const { name, email, department } = req.body;

    const db = client.db("lms_3");

    // Check if faculty member already exists
    const existingFaculty = await db.collection("users").findOne({ email });
    if (existingFaculty) {
      return res
        .status(400)
        .json({ message: "Faculty member with this email already exists" });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const faculty = {
      name,
      email,
      password: hashedPassword,
      role: "faculty",
      department,
      createdAt: new Date(),
    };

    const result = await db.collection("users").insertOne(faculty);
    faculty._id = result.insertedId;

    // Remove password from response
    delete faculty.password;

    res.status(201).json({
      message: "Faculty member added successfully",
      faculty,
      tempPassword, // Send temporary password in response
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding faculty member", error: error.message });
  }
});

// Update faculty member
app.put("/api/faculty/:id", isAuthenticated, async (req, res) => {
  try {
    const { name, email, department } = req.body;
    const db = client.db("lms_3");

    // Check if email is being changed and if it's already in use
    const existingFaculty = await db
      .collection("users")
      .findOne({ email, _id: { $ne: new ObjectId(req.params.id) } });
    if (existingFaculty) {
      return res
        .status(400)
        .json({ message: "Email already in use by another faculty member" });
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(req.params.id), role: "faculty" },
      {
        $set: {
          name,
          email,
          department,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Faculty member not found" });
    }

    res.json({ message: "Faculty member updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating faculty member", error: error.message });
  }
});

// Delete faculty member
app.delete("/api/faculty/:id", isAuthenticated, async (req, res) => {
  try {
    const db = client.db("lms_3");
    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(req.params.id), role: "faculty" });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Faculty member not found" });
    }

    res.json({ message: "Faculty member deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting faculty member", error: error.message });
  }
});

// Department Management Endpoints
app.get("/api/departments", isAuthenticated, async (req, res) => {
  try {
    const db = client.db("lms_3");
    const departments = await db.collection("departments").find().toArray();
    res.json(departments);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching departments", error: error.message });
  }
});

app.post("/api/departments", isAuthenticated, async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const db = client.db("lms_3");

    // Check if department already exists
    const existingDepartment = await db
      .collection("departments")
      .findOne({ code });
    if (existingDepartment) {
      return res
        .status(400)
        .json({ message: "Department with this code already exists" });
    }

    const department = {
      name,
      code,
      description,
      createdAt: new Date(),
    };

    const result = await db.collection("departments").insertOne(department);
    department._id = result.insertedId;

    res.status(201).json(department);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding department", error: error.message });
  }
});

app.put("/api/departments/:id", isAuthenticated, async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const db = client.db("lms_3");

    // Check if code is being changed and if it's already in use
    const existingDepartment = await db.collection("departments").findOne({
      code,
      _id: { $ne: new ObjectId(req.params.id) },
    });
    if (existingDepartment) {
      return res
        .status(400)
        .json({ message: "Department code already in use" });
    }

    const result = await db.collection("departments").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          name,
          code,
          description,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({ message: "Department updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating department", error: error.message });
  }
});

app.delete("/api/departments/:id", isAuthenticated, async (req, res) => {
  try {
    const db = client.db("lms_3");
    const result = await db
      .collection("departments")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting department", error: error.message });
  }
});

// Import Course model
const Course = require("./models/Course");

// Course Management Endpoints
app.get("/api/courses", isAuthenticated, async (req, res) => {
  try {
    console.log("Fetching courses...");
    console.log("MongoDB connection state:", mongoose.connection.readyState);

    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database connection is not ready");
    }

    const courses = await Course.find()
      .populate("instructor", "name email")
      .sort({ createdAt: -1 });

    console.log("Courses fetched successfully:", courses);
    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error fetching courses",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

app.post("/api/courses", isAuthenticated, async (req, res) => {
  try {
    const {
      name,
      code,
      credits,
      department,
      description,
      semester,
      instructor,
    } = req.body;
    console.log("Creating course with data:", req.body);

    // Validate required fields
    if (
      !name ||
      !code ||
      !credits ||
      !department ||
      !description ||
      !semester
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({ message: "Course code already exists" });
    }

    const course = new Course({
      name,
      code,
      credits,
      department,
      description,
      semester,
      instructor: instructor || null,
    });

    await course.save();
    console.log("Course created successfully:", course);
    res.status(201).json(course);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({
      message: "Error creating course",
      error: error.message,
    });
  }
});

app.put("/api/courses/:id", isAuthenticated, async (req, res) => {
  try {
    const {
      name,
      code,
      credits,
      department,
      description,
      semester,
      instructor,
      isActive,
    } = req.body;
    const courseId = req.params.id;
    console.log("Updating course:", courseId, "with data:", req.body);

    // Validate required fields
    if (
      !name ||
      !code ||
      !credits ||
      !department ||
      !description ||
      !semester
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if course code already exists for a different course
    const existingCourse = await Course.findOne({
      code,
      _id: { $ne: courseId },
    });
    if (existingCourse) {
      return res.status(400).json({ message: "Course code already exists" });
    }

    const course = await Course.findByIdAndUpdate(
      courseId,
      {
        name,
        code,
        credits,
        department,
        description,
        semester,
        instructor: instructor || null,
        isActive,
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    console.log("Course updated successfully:", course);
    res.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({
      message: "Error updating course",
      error: error.message,
    });
  }
});

app.delete("/api/courses/:id", isAuthenticated, async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log("Deleting course:", courseId);

    const course = await Course.findByIdAndDelete(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    console.log("Course deleted successfully:", course);
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({
      message: "Error deleting course",
      error: error.message,
    });
  }
});

// Program Management Endpoints
app.get("/api/programs", isAuthenticated, async (req, res) => {
  try {
    const db = client.db("lms_3");
    const programs = await db.collection("programs").find().toArray();
    res.json(programs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching programs", error: error.message });
  }
});

app.post("/api/programs", isAuthenticated, async (req, res) => {
  try {
    const { name, code, department, duration, description } = req.body;
    const db = client.db("lms_3");

    // Check if program already exists
    const existingProgram = await db.collection("programs").findOne({ code });
    if (existingProgram) {
      return res
        .status(400)
        .json({ message: "Program with this code already exists" });
    }

    const program = {
      name,
      code,
      department,
      duration,
      description,
      createdAt: new Date(),
    };

    const result = await db.collection("programs").insertOne(program);
    program._id = result.insertedId;

    res.status(201).json(program);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding program", error: error.message });
  }
});

app.put("/api/programs/:id", isAuthenticated, async (req, res) => {
  try {
    const { name, code, department, duration, description } = req.body;
    const db = client.db("lms_3");

    // Check if code is being changed and if it's already in use
    const existingProgram = await db.collection("programs").findOne({
      code,
      _id: { $ne: new ObjectId(req.params.id) },
    });
    if (existingProgram) {
      return res.status(400).json({ message: "Program code already in use" });
    }

    const result = await db.collection("programs").updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          name,
          code,
          department,
          duration,
          description,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.json({ message: "Program updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating program", error: error.message });
  }
});

app.delete("/api/programs/:id", isAuthenticated, async (req, res) => {
  try {
    const db = client.db("lms_3");
    const result = await db
      .collection("programs")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Program not found" });
    }

    res.json({ message: "Program deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting program", error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/lms_3", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected from MongoDB");
});

// Handle application termination
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("Mongoose connection closed through app termination");
    process.exit(0);
  } catch (err) {
    console.error("Error during mongoose connection closure:", err);
    process.exit(1);
  }
});
