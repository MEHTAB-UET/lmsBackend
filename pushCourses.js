const mongoose = require("mongoose");
const Course = require("./models/Course");

// Sample courses data
const courses = [
  {
    name: "Introduction to Computer Science",
    code: "CS101",
    credits: 3,
    department: "Computer Science",
    description: "Fundamental concepts of computer science and programming",
    semester: 1,
    isActive: true,
  },
  {
    name: "Data Structures and Algorithms",
    code: "CS201",
    credits: 4,
    department: "Computer Science",
    description: "Study of fundamental data structures and algorithms",
    semester: 2,
    isActive: true,
  },
  {
    name: "Database Management Systems",
    code: "CS301",
    credits: 3,
    department: "Computer Science",
    description: "Design and implementation of database systems",
    semester: 3,
    isActive: true,
  },
  {
    name: "Web Development",
    code: "CS401",
    credits: 3,
    department: "Computer Science",
    description: "Modern web development technologies and practices",
    semester: 4,
    isActive: true,
  },
  {
    name: "Software Engineering",
    code: "CS501",
    credits: 4,
    department: "Computer Science",
    description: "Software development methodologies and practices",
    semester: 5,
    isActive: true,
  },
  {
    name: "Artificial Intelligence",
    code: "CS601",
    credits: 3,
    department: "Computer Science",
    description: "Introduction to AI concepts and machine learning",
    semester: 6,
    isActive: true,
  },
  {
    name: "Computer Networks",
    code: "CS701",
    credits: 3,
    department: "Computer Science",
    description: "Network protocols and communication systems",
    semester: 7,
    isActive: true,
  },
  {
    name: "Final Year Project",
    code: "CS801",
    credits: 6,
    department: "Computer Science",
    description: "Capstone project demonstrating technical skills",
    semester: 8,
    isActive: true,
  },
  {
    name: "Calculus I",
    code: "MATH101",
    credits: 3,
    department: "Mathematics",
    description: "Introduction to differential and integral calculus",
    semester: 1,
    isActive: true,
  },
  {
    name: "Linear Algebra",
    code: "MATH201",
    credits: 3,
    department: "Mathematics",
    description: "Vector spaces, matrices, and linear transformations",
    semester: 2,
    isActive: true,
  },
  {
    name: "Probability and Statistics",
    code: "MATH301",
    credits: 3,
    department: "Mathematics",
    description: "Probability theory and statistical methods",
    semester: 3,
    isActive: true,
  },
  {
    name: "Discrete Mathematics",
    code: "MATH401",
    credits: 3,
    department: "Mathematics",
    description: "Logic, sets, relations, and graph theory",
    semester: 4,
    isActive: true,
  },
  {
    name: "Digital Electronics",
    code: "EE101",
    credits: 3,
    department: "Electrical Engineering",
    description: "Digital circuits and logic design",
    semester: 1,
    isActive: true,
  },
  {
    name: "Circuit Analysis",
    code: "EE201",
    credits: 4,
    department: "Electrical Engineering",
    description: "Analysis of electrical circuits and networks",
    semester: 2,
    isActive: true,
  },
  {
    name: "Electromagnetic Theory",
    code: "EE301",
    credits: 3,
    department: "Electrical Engineering",
    description: "Electromagnetic fields and waves",
    semester: 3,
    isActive: true,
  },
  {
    name: "Power Systems",
    code: "EE401",
    credits: 3,
    department: "Electrical Engineering",
    description: "Analysis and design of power systems",
    semester: 4,
    isActive: true,
  },
  {
    name: "Control Systems",
    code: "EE501",
    credits: 3,
    department: "Electrical Engineering",
    description: "Analysis and design of control systems",
    semester: 5,
    isActive: true,
  },
  {
    name: "Digital Signal Processing",
    code: "EE601",
    credits: 3,
    department: "Electrical Engineering",
    description: "Digital signal processing techniques",
    semester: 6,
    isActive: true,
  },
  {
    name: "Microprocessors",
    code: "EE701",
    credits: 3,
    department: "Electrical Engineering",
    description: "Microprocessor architecture and programming",
    semester: 7,
    isActive: true,
  },
  {
    name: "Power Electronics",
    code: "EE801",
    credits: 3,
    department: "Electrical Engineering",
    description: "Power electronic devices and circuits",
    semester: 8,
    isActive: true,
  },
];

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://aliirtiza859:Irtizaali859.@irtizacluster.l7kp5.mongodb.net/lms_3",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(async () => {
    console.log("Connected to MongoDB");

    try {
      // Clear existing courses
      await Course.deleteMany({});
      console.log("Cleared existing courses");

      // Insert new courses
      const result = await Course.insertMany(courses);
      console.log(`Successfully added ${result.length} courses`);

      // Log the added courses
      console.log("Added courses:");
      result.forEach((course) => {
        console.log(`- ${course.code}: ${course.name}`);
      });
    } catch (error) {
      console.error("Error adding courses:", error);
    } finally {
      // Close the database connection
      await mongoose.connection.close();
      console.log("Database connection closed");
    }
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });
