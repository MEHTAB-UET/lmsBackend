const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const fs = require("fs");

const uri =
  "mongodb+srv://aliirtiza859:Irtizaali859.@irtizacluster.l7kp5.mongodb.net/lms_3";

// Helper function to write to credentials file
function writeToCredentialsFile(data) {
  // Write to timestamped file
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `user_credentials_${timestamp}.txt`;
  fs.writeFileSync(filename, data);
  console.log(`Credentials written to ${filename}`);

  // Also write to static Credentials.txt
  fs.writeFileSync("Credentials.txt", data);
  console.log("Credentials also written to Credentials.txt");
}

async function createInitialUsers() {
  const client = new MongoClient(uri);
  let credentialsData = "=== LMS User Credentials ===\n\n";

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("lms_3");
    const usersCollection = db.collection("users");

    // Clear existing users
    await usersCollection.deleteMany({});
    console.log("Cleared existing users");

    // Create admin user
    const adminSalt = await bcrypt.genSalt(10);
    const adminHashedPassword = await bcrypt.hash("Password@12", adminSalt);

    const admin = {
      email: "waqas@UVAS.admin.edu.pk".toLowerCase(),
      password: adminHashedPassword,
      role: "admin",
      name: "Waqas",
      department: "Administration",
      createdAt: new Date(),
    };

    await usersCollection.insertOne(admin);
    credentialsData += "=== Admin User ===\n";
    credentialsData += `Email: ${admin.email}\n`;
    credentialsData += `Password: Password@12\n`;
    credentialsData += `Role: ${admin.role}\n`;
    credentialsData += `Department: ${admin.department}\n\n`;

    // Create faculty members
    const departments = [
      "Computer Science",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
    ];
    const facultyNames = [
      "Dr. Ahmed Khan",
      "Dr. Sarah Malik",
      "Dr. Usman Ali",
      "Dr. Fatima Zahra",
      "Dr. Muhammad Hassan",
      "Dr. Ayesha Khan",
      "Dr. Bilal Ahmed",
      "Dr. Sana Malik",
      "Dr. Imran Khan",
      "Dr. Nida Ali",
      "Dr. Zain Malik",
      "Dr. Hina Khan",
      "Dr. Faisal Ahmed",
      "Dr. Mariam Khan",
      "Dr. Hamza Ali",
      "Dr. Aisha Malik",
      "Dr. Omar Khan",
      "Dr. Layla Ahmed",
      "Dr. Rayyan Ali",
      "Dr. Zara Khan",
    ];

    credentialsData += "=== Faculty Members ===\n";
    for (let i = 0; i < 20; i++) {
      const salt = await bcrypt.genSalt(10);
      const password = `Faculty${i + 1}@2024`;
      const hashedPassword = await bcrypt.hash(password, salt);

      const faculty = {
        email: `faculty${i + 1}@UVAS.faculty.edu.pk`.toLowerCase(),
        password: hashedPassword,
        role: "faculty",
        name: facultyNames[i],
        department: departments[i % departments.length],
        createdAt: new Date(),
      };

      await usersCollection.insertOne(faculty);

      credentialsData += `\nFaculty ${i + 1}:\n`;
      credentialsData += `Name: ${faculty.name}\n`;
      credentialsData += `Email: ${faculty.email}\n`;
      credentialsData += `Password: ${password}\n`;
      credentialsData += `Department: ${faculty.department}\n`;
    }

    // Create students
    const studentNames = [
      "Ali Raza",
      "Sana Khan",
      "Usman Ali",
      "Fatima Malik",
      "Hassan Ahmed",
      "Ayesha Khan",
      "Bilal Malik",
      "Zainab Ali",
      "Hamza Khan",
      "Mariam Ahmed",
      "Faisal Malik",
      "Hina Khan",
      "Omar Ali",
      "Layla Khan",
      "Rayyan Ahmed",
      "Zara Malik",
      "Ahmed Khan",
      "Sara Ali",
      "Imran Malik",
      "Nida Khan",
      "Kamran Ali",
      "Sadia Khan",
      "Waqar Malik",
      "Hina Ahmed",
      "Usama Khan",
      "Ayesha Malik",
      "Bilal Ali",
      "Zainab Khan",
      "Hamza Malik",
      "Mariam Ali",
      "Faisal Khan",
      "Hina Malik",
      "Omar Ahmed",
      "Layla Ali",
      "Rayyan Khan",
      "Zara Ahmed",
      "Ahmed Malik",
      "Sara Khan",
      "Imran Ali",
      "Nida Malik",
    ];
    const programs = ["BS Computer Science"];
    const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

    credentialsData += "\n\n=== Students ===\n";
    for (let i = 0; i < 40; i++) {
      const salt = await bcrypt.genSalt(10);
      const password = `Student${i + 1}@2024`;
      const hashedPassword = await bcrypt.hash(password, salt);

      const student = {
        email: `student${i + 1}@UVAS.student.edu.pk`.toLowerCase(),
        password: hashedPassword,
        role: "student",
        name: studentNames[i],
        department: departments[i % departments.length],
        program: programs[0],
        semester: semesters[i % semesters.length],
        createdAt: new Date(),
      };

      await usersCollection.insertOne(student);

      credentialsData += `\nStudent ${i + 1}:\n`;
      credentialsData += `Name: ${student.name}\n`;
      credentialsData += `Email: ${student.email}\n`;
      credentialsData += `Password: ${password}\n`;
      credentialsData += `Department: ${student.department}\n`;
      credentialsData += `Program: ${student.program}\n`;
      credentialsData += `Semester: ${student.semester}\n`;
    }

    // Write credentials to file
    writeToCredentialsFile(credentialsData);
    console.log("Successfully created initial users");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

createInitialUsers();
