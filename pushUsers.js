const mongoose = require("mongoose");
const User = require("./models/User");
const fs = require("fs");
const path = require("path");

// MongoDB Atlas connection
const MONGODB_URI =
  "mongodb+srv://aliirtiza859:Irtizaali859.@irtizacluster.l7kp5.mongodb.net/lms_3";

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
    pushUsers();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Department and Program mapping
const departments = {
  "Computer Science": {
    programs: [
      "BS Computer Science",
      "MS Computer Science",
      "PhD Computer Science",
    ],
    courses: [
      { code: "CS101", name: "Introduction to Programming", credits: 3 },
      { code: "CS201", name: "Data Structures", credits: 3 },
      { code: "CS301", name: "Database Systems", credits: 3 },
      { code: "CS401", name: "Software Engineering", credits: 3 },
      { code: "CS501", name: "Artificial Intelligence", credits: 3 },
    ],
  },
  Mathematics: {
    programs: ["BS Mathematics", "MS Mathematics", "PhD Mathematics"],
    courses: [
      { code: "MATH101", name: "Calculus I", credits: 3 },
      { code: "MATH201", name: "Linear Algebra", credits: 3 },
      { code: "MATH301", name: "Differential Equations", credits: 3 },
      { code: "MATH401", name: "Number Theory", credits: 3 },
      { code: "MATH501", name: "Abstract Algebra", credits: 3 },
    ],
  },
  Physics: {
    programs: ["BS Physics", "MS Physics", "PhD Physics"],
    courses: [
      { code: "PHY101", name: "Mechanics", credits: 3 },
      { code: "PHY201", name: "Electromagnetism", credits: 3 },
      { code: "PHY301", name: "Quantum Mechanics", credits: 3 },
      { code: "PHY401", name: "Thermodynamics", credits: 3 },
      { code: "PHY501", name: "Nuclear Physics", credits: 3 },
    ],
  },
  Chemistry: {
    programs: ["BS Chemistry", "MS Chemistry", "PhD Chemistry"],
    courses: [
      { code: "CHEM101", name: "General Chemistry", credits: 3 },
      { code: "CHEM201", name: "Organic Chemistry", credits: 3 },
      { code: "CHEM301", name: "Physical Chemistry", credits: 3 },
      { code: "CHEM401", name: "Inorganic Chemistry", credits: 3 },
      { code: "CHEM501", name: "Biochemistry", credits: 3 },
    ],
  },
  "Electrical Engineering": {
    programs: [
      "BS Electrical Engineering",
      "MS Electrical Engineering",
      "PhD Electrical Engineering",
    ],
    courses: [
      { code: "EE101", name: "Circuit Analysis", credits: 3 },
      { code: "EE201", name: "Digital Electronics", credits: 3 },
      { code: "EE301", name: "Power Systems", credits: 3 },
      { code: "EE401", name: "Control Systems", credits: 3 },
      { code: "EE501", name: "Communication Systems", credits: 3 },
    ],
  },
};

// Generate random data
const generateRandomUser = (role, index) => {
  const firstName = [
    "Ali",
    "Ahmed",
    "Sana",
    "Fatima",
    "Usman",
    "Hassan",
    "Ayesha",
    "Zainab",
    "Mohammad",
    "Sara",
  ][Math.floor(Math.random() * 10)];
  const lastName = [
    "Khan",
    "Ali",
    "Hussain",
    "Malik",
    "Raza",
    "Shah",
    "Butt",
    "Chaudhry",
    "Akhtar",
    "Rizvi",
  ][Math.floor(Math.random() * 10)];
  const name = `${firstName} ${lastName}`;

  if (role === "admin") {
    return {
      name: "Waqas",
      email: "waqas@UVAS.admin.edu.pk",
      password: "Admin@2024",
      role: "admin",
      department: "Administration",
      status: "active",
    };
  }

  if (role === "faculty") {
    const dept =
      Object.keys(departments)[
        Math.floor(Math.random() * Object.keys(departments).length)
      ];
    const deptCourses = departments[dept].courses;
    const assignedCourses = deptCourses.slice(
      0,
      Math.floor(Math.random() * 3) + 1
    ); // 1-3 courses

    return {
      name,
      email: `${name.toLowerCase().replace(" ", "")}@UVAS.faculty.edu.pk`,
      password: `Faculty${index}@2024`,
      role: "faculty",
      department: dept,
      designation: ["Professor", "Associate Professor", "Assistant Professor"][
        Math.floor(Math.random() * 3)
      ],
      qualification: ["PhD", "MS"][Math.floor(Math.random() * 2)],
      status: "active",
      assignedCourses: assignedCourses.map((course) => ({
        courseCode: course.code,
        courseName: course.name,
        credits: course.credits,
        semester: Math.floor(Math.random() * 8) + 1,
      })),
      contactInfo: {
        phone: `+92-300-${Math.floor(Math.random() * 9000000 + 1000000)}`,
        address: ["Lahore", "Karachi", "Islamabad", "Faisalabad", "Multan"][
          Math.floor(Math.random() * 5)
        ],
      },
    };
  }

  // Student
  const dept =
    Object.keys(departments)[
      Math.floor(Math.random() * Object.keys(departments).length)
    ];
  const program =
    departments[dept].programs[
      Math.floor(Math.random() * departments[dept].programs.length)
    ];
  const semester = Math.floor(Math.random() * 8) + 1;
  const cgpa = (Math.random() * 2 + 2).toFixed(2); // Random CGPA between 2.00 and 4.00

  // Get courses for the student's department and semester
  const deptCourses = departments[dept].courses;
  const enrolledCourses = deptCourses.slice(
    0,
    Math.floor(Math.random() * 3) + 3
  ); // 3-5 courses

  return {
    name,
    email: `${name.toLowerCase().replace(" ", "")}@UVAS.student.edu.pk`,
    password: `Student${index}@2024`,
    role: "student",
    department: dept,
    program,
    semester,
    cgpa: parseFloat(cgpa),
    enrollmentDate: new Date(2023 - Math.floor(Math.random() * 4), 8, 1), // Random date between 2020-2023
    status: "active",
    enrolledCourses: enrolledCourses.map((course) => ({
      courseCode: course.code,
      courseName: course.name,
      credits: course.credits,
      grade: [
        "A+",
        "A",
        "A-",
        "B+",
        "B",
        "B-",
        "C+",
        "C",
        "C-",
        "D+",
        "D",
        "F",
      ][Math.floor(Math.random() * 12)],
    })),
    contactInfo: {
      phone: `+92-300-${Math.floor(Math.random() * 9000000 + 1000000)}`,
      address: ["Lahore", "Karachi", "Islamabad", "Faisalabad", "Multan"][
        Math.floor(Math.random() * 5)
      ],
    },
  };
};

// Generate users
const users = [
  // Admin
  generateRandomUser("admin", 1),

  // Faculty
  ...Array.from({ length: 20 }, (_, i) => generateRandomUser("faculty", i + 1)),

  // Students
  ...Array.from({ length: 50 }, (_, i) => generateRandomUser("student", i + 1)),
];

const generateCredentialsFile = (users) => {
  const credentialsContent = users
    .map((user, index) => {
      let content = `${user.role.toUpperCase()} ${index + 1}:
Name: ${user.name}
Email: ${user.email}
Password: ${user.password}
Department: ${user.department}
Status: ${user.status}`;

      if (user.role === "faculty") {
        content += `\nDesignation: ${user.designation}
Qualification: ${user.qualification}

Assigned Courses:
${user.assignedCourses
  .map(
    (course) =>
      `- ${course.courseCode}: ${course.courseName} (Semester ${course.semester})`
  )
  .join("\n")}`;
      }

      if (user.role === "student") {
        content += `\nProgram: ${user.program}
Semester: ${user.semester}
CGPA: ${user.cgpa}
Enrollment Date: ${user.enrollmentDate.toLocaleDateString()}

Enrolled Courses:
${user.enrolledCourses
  .map(
    (course) =>
      `- ${course.courseCode}: ${course.courseName} (Grade: ${course.grade})`
  )
  .join("\n")}`;
      }

      content += `\nContact: ${user.contactInfo?.phone || "N/A"}
Address: ${user.contactInfo?.address || "N/A"}

----------------------------------------
`;
      return content;
    })
    .join("\n");

  const filePath = path.join(__dirname, "Credentials.txt");
  fs.writeFileSync(filePath, credentialsContent);
  console.log("Credentials.txt file has been generated successfully!");
};

const pushUsers = async () => {
  try {
    // Generate credentials file
    generateCredentialsFile(users);

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Insert users one by one to handle potential duplicate key errors
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Drop the email index if it exists
    try {
      await usersCollection.dropIndex("email_1");
    } catch (error) {
      console.log("No email index to drop");
    }

    // Insert users
    for (const user of users) {
      try {
        await usersCollection.insertOne(user);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`Skipping duplicate user: ${user.email}`);
          continue;
        }
        throw error;
      }
    }

    console.log("Users pushed successfully");

    // Close MongoDB connection
    mongoose.connection.close();
  } catch (error) {
    console.error("Error pushing users:", error);
    mongoose.connection.close();
  }
};
