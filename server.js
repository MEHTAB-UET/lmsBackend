const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const session = require("express-session");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const Course = require("./models/Course");
const Program = require("./models/Program");
const Admission = require("./models/Admission");
const User = require("./models/User");
const app = express();
// git commit
// MongoDB connection
const uri =
  "mongodb+srv://aliirtiza859:Irtizaali859.@irtizacluster.l7kp5.mongodb.net/lms_3";

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
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
      httpOnly: true,
    },
    name: "sessionId", // Custom session cookie name
  })
);

// Add session debugging middleware
app.use((req, res, next) => {
  console.log("=== Session Debug ===");
  console.log("Session ID:", req.session.id);
  console.log("Session Data:", {
    userId: req.session.userId,
    role: req.session.role,
  });
  next();
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
};

// Connect to MongoDB
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Profile endpoint to check session status
app.get("/api/profile", isAuthenticated, async (req, res) => {
  try {
    const db = mongoose.connection.db;
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
    console.log("Login attempt:", { email });

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Find user - convert email to lowercase for case-insensitive comparison
    const user = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });

    console.log(
      "Found user:",
      user
        ? {
            _id: user._id,
            name: user.name,
            role: user.role,
            email: user.email,
          }
        : "No user found"
    );

    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ message: "User not found" });
    }

    // Compare plain text passwords
    if (password !== user.password) {
      console.log("Invalid password for user:", email);
      return res.status(400).json({ message: "Invalid password" });
    }

    // Convert ObjectId to string for session
    const userId = user._id.toString();
    console.log("Setting session with userId:", userId);

    // Set session
    req.session.userId = userId;
    req.session.role = user.role;

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session:", err);
        return res.status(500).json({ message: "Error saving session" });
      }

      console.log("Login successful for:", email);
      console.log("Session after login:", {
        id: req.session.id,
        userId: req.session.userId,
        role: req.session.role,
      });

      res.json({
        message: "Logged in successfully",
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          program: user.program,
          semester: user.semester,
        },
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// Register endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password, role, department, program, semester } =
      req.body;

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Check if user already exists - case insensitive
    const existingUser = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user - store email in lowercase
    const user = {
      name,
      email: email.toLowerCase(),
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
    console.log("Fetching students...");
    console.log("Session user:", req.session.userId);

    const db = mongoose.connection.db;
    const students = await db
      .collection("users")
      .find({ role: "student" })
      .toArray();
    console.log("Raw students data:", students);
    console.log("Found students:", students.length);

    // Transform the data
    const transformedStudents = students.map((student) => ({
      _id: student._id.toString(),
      name: student.name,
      email: student.email,
      department: student.department,
      program: student.program,
      semester: student.semester,
      cgpa: student.cgpa,
      enrollmentDate: student.enrollmentDate,
      status: student.status,
      enrolledCourses: student.enrolledCourses || [],
      contactInfo: student.contactInfo || {},
    }));

    console.log("Transformed students data:", transformedStudents);
    console.log("Sending students data:", transformedStudents.length);
    res.json(transformedStudents);
  } catch (error) {
    console.error("Error in /api/students:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error fetching students",
      error: error.message,
    });
  }
});

// Get single student
app.get("/api/students/:id", isAuthenticated, async (req, res) => {
  try {
    const db = mongoose.connection.db;
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

    const db = mongoose.connection.db;

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

    const db = mongoose.connection.db;

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
    const db = mongoose.connection.db;
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
    const db = mongoose.connection.db;
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
    const db = mongoose.connection.db;
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

// Get faculty member's assigned courses
app.get(
  "/api/faculty/:facultyId/assigned-courses",
  isAuthenticated,
  async (req, res) => {
    try {
      console.log("=== Assigned Courses Endpoint ===");
      console.log("Faculty ID from URL:", req.params.facultyId);
      console.log("Session data:", req.session);

      // Convert string ID to ObjectId
      let facultyId;
      try {
        facultyId = new ObjectId(req.params.facultyId);
        console.log("Converted facultyId:", facultyId);
      } catch (error) {
        console.error("Error converting ID to ObjectId:", error);
        return res.status(400).json({ message: "Invalid faculty ID format" });
      }

      // Use the User model to find the faculty member
      const faculty = await User.findById(facultyId);
      console.log("Database query result:", faculty);

      if (!faculty) {
        console.log("Faculty not found in database");
        return res.status(404).json({ message: "Faculty member not found" });
      }

      if (faculty.role !== "faculty") {
        console.log("User is not a faculty member, role:", faculty.role);
        return res.status(403).json({ message: "Not authorized as faculty" });
      }

      console.log("Found faculty:", {
        name: faculty.name,
        department: faculty.department,
        assignedCoursesCount: faculty.assignedCourses
          ? faculty.assignedCourses.length
          : 0,
      });

      // Return faculty info and assigned courses
      res.json({
        facultyName: faculty.name,
        department: faculty.department,
        designation: faculty.designation,
        assignedCourses: faculty.assignedCourses || [],
      });
    } catch (error) {
      console.error(
        "Error in /api/faculty/:facultyId/assigned-courses:",
        error
      );
      console.error("Error stack:", error.stack);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        code: error.code,
      });
      res.status(500).json({
        message: "Error fetching assigned courses",
        error: error.message,
      });
    }
  }
);

// Add new faculty member
app.post("/api/faculty", isAuthenticated, async (req, res) => {
  try {
    const { name, email, department } = req.body;

    const db = mongoose.connection.db;

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
    const db = mongoose.connection.db;

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
    const db = mongoose.connection.db;
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
    const db = mongoose.connection.db;
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
    const db = mongoose.connection.db;

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
    const db = mongoose.connection.db;

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
    const db = mongoose.connection.db;
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

// Course Management Endpoints
app.get("/api/courses", isAuthenticated, async (req, res) => {
  try {
    console.log("Fetching courses...");

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error(
        "Database not connected. Current state:",
        mongoose.connection.readyState
      );
      return res.status(500).json({ message: "Database connection not ready" });
    }

    // Fetch courses without population first
    const courses = await Course.find().sort({ createdAt: -1 });

    // If there are no courses, return empty array
    if (!courses || courses.length === 0) {
      return res.json([]);
    }

    // Try to populate instructor if available
    const populatedCourses = await Promise.all(
      courses.map(async (course) => {
        if (course.instructor) {
          try {
            await course.populate("instructor", "name email");
          } catch (populateError) {
            console.warn(
              `Could not populate instructor for course ${course.code}:`,
              populateError
            );
          }
        }
        return course;
      })
    );

    console.log("Courses fetched successfully:", populatedCourses.length);
    res.json(populatedCourses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Error fetching courses",
      error: error.message,
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
    console.log("Fetching programs...");

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error(
        "Database not connected. Current state:",
        mongoose.connection.readyState
      );
      return res.status(500).json({ message: "Database connection not ready" });
    }

    const programs = await Program.find().sort({ createdAt: -1 });
    console.log("Programs fetched successfully:", programs.length);
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({
      message: "Error fetching programs",
      error: error.message,
    });
  }
});

app.post("/api/programs", isAuthenticated, async (req, res) => {
  try {
    const { name, code, department, duration, description } = req.body;
    console.log("Creating program with data:", req.body);

    // Validate required fields
    if (!name || !code || !department || !duration || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if program code already exists
    const existingProgram = await Program.findOne({ code });
    if (existingProgram) {
      return res.status(400).json({ message: "Program code already exists" });
    }

    const program = new Program({
      name,
      code,
      department,
      duration,
      description,
    });

    await program.save();
    console.log("Program created successfully:", program);
    res.status(201).json(program);
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).json({
      message: "Error creating program",
      error: error.message,
    });
  }
});

app.put("/api/programs/:id", isAuthenticated, async (req, res) => {
  try {
    const { name, code, department, duration, description, isActive } =
      req.body;
    const programId = req.params.id;
    console.log("Updating program:", programId, "with data:", req.body);

    // Validate required fields
    if (!name || !code || !department || !duration || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if program code already exists for a different program
    const existingProgram = await Program.findOne({
      code,
      _id: { $ne: programId },
    });
    if (existingProgram) {
      return res.status(400).json({ message: "Program code already exists" });
    }

    const program = await Program.findByIdAndUpdate(
      programId,
      {
        name,
        code,
        department,
        duration,
        description,
        isActive,
      },
      { new: true }
    );

    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    console.log("Program updated successfully:", program);
    res.json(program);
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({
      message: "Error updating program",
      error: error.message,
    });
  }
});

app.delete("/api/programs/:id", isAuthenticated, async (req, res) => {
  try {
    const programId = req.params.id;
    console.log("Deleting program:", programId);

    const program = await Program.findByIdAndDelete(programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    console.log("Program deleted successfully:", program);
    res.json({ message: "Program deleted successfully" });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({
      message: "Error deleting program",
      error: error.message,
    });
  }
});

// Admission Management Endpoints
app.get("/api/admissions", isAuthenticated, async (req, res) => {
  try {
    console.log("Fetching admissions...");

    if (mongoose.connection.readyState !== 1) {
      console.error(
        "Database not connected. Current state:",
        mongoose.connection.readyState
      );
      return res.status(500).json({ message: "Database connection not ready" });
    }

    const admissions = await Admission.find()
      .populate("program", "name code")
      .sort({ createdAt: -1 });

    console.log("Admissions fetched successfully:", admissions.length);
    res.json(admissions);
  } catch (error) {
    console.error("Error fetching admissions:", error);
    res.status(500).json({
      message: "Error fetching admissions",
      error: error.message,
    });
  }
});

app.post("/api/admissions", isAuthenticated, async (req, res) => {
  try {
    const {
      studentId,
      firstName,
      lastName,
      email,
      phone,
      program,
      documents,
      address,
      comments,
    } = req.body;

    console.log("Creating admission with data:", req.body);

    // Validate required fields
    if (
      !studentId ||
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !program ||
      !documents ||
      !address
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    // Check if student ID or email already exists
    const existingAdmission = await Admission.findOne({
      $or: [{ studentId }, { email }],
    });

    if (existingAdmission) {
      return res.status(400).json({
        message: "Student ID or email already exists",
      });
    }

    const admission = new Admission({
      studentId,
      firstName,
      lastName,
      email,
      phone,
      program,
      documents,
      address,
      comments,
    });

    await admission.save();
    console.log("Admission created successfully:", admission);
    res.status(201).json(admission);
  } catch (error) {
    console.error("Error creating admission:", error);
    res.status(500).json({
      message: "Error creating admission",
      error: error.message,
    });
  }
});

app.put("/api/admissions/:id", isAuthenticated, async (req, res) => {
  try {
    const admissionId = req.params.id;
    const {
      firstName,
      lastName,
      email,
      phone,
      program,
      status,
      documents,
      address,
      comments,
    } = req.body;

    console.log("Updating admission:", admissionId, "with data:", req.body);

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !program ||
      !documents ||
      !address
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided" });
    }

    // Check if email already exists for a different admission
    const existingAdmission = await Admission.findOne({
      email,
      _id: { $ne: admissionId },
    });

    if (existingAdmission) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const admission = await Admission.findByIdAndUpdate(
      admissionId,
      {
        firstName,
        lastName,
        email,
        phone,
        program,
        status,
        documents,
        address,
        comments,
      },
      { new: true }
    ).populate("program", "name code");

    if (!admission) {
      return res.status(404).json({ message: "Admission not found" });
    }

    console.log("Admission updated successfully:", admission);
    res.json(admission);
  } catch (error) {
    console.error("Error updating admission:", error);
    res.status(500).json({
      message: "Error updating admission",
      error: error.message,
    });
  }
});

app.delete("/api/admissions/:id", isAuthenticated, async (req, res) => {
  try {
    const admissionId = req.params.id;
    console.log("Deleting admission:", admissionId);

    const admission = await Admission.findByIdAndDelete(admissionId);
    if (!admission) {
      return res.status(404).json({ message: "Admission not found" });
    }

    console.log("Admission deleted successfully:", admission);
    res.json({ message: "Admission deleted successfully" });
  } catch (error) {
    console.error("Error deleting admission:", error);
    res.status(500).json({
      message: "Error deleting admission",
      error: error.message,
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
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
