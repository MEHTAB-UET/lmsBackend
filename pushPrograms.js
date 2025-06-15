const mongoose = require("mongoose");
const Program = require("./models/Program");

const uri =
  "mongodb+srv://aliirtiza859:Irtizaali859.@irtizacluster.l7kp5.mongodb.net/lms_3";

const samplePrograms = [
  {
    name: "Bachelor of Science in Computer Science",
    code: "BSCS",
    department: "Computer Science",
    duration: "4 years",
    description:
      "A comprehensive program covering computer science fundamentals, programming, algorithms, and software development.",
  },
  {
    name: "Bachelor of Science in Information Technology",
    code: "BSIT",
    department: "Information Technology",
    duration: "4 years",
    description:
      "Focuses on IT infrastructure, networking, database management, and information systems.",
  },
  {
    name: "Bachelor of Science in Software Engineering",
    code: "BSSE",
    department: "Software Engineering",
    duration: "4 years",
    description:
      "Emphasizes software development methodologies, project management, and quality assurance.",
  },
  {
    name: "Master of Science in Computer Science",
    code: "MSCS",
    department: "Computer Science",
    duration: "2 years",
    description:
      "Advanced study in computer science with focus on research and specialized areas.",
  },
  {
    name: "Master of Science in Information Technology",
    code: "MSIT",
    department: "Information Technology",
    duration: "2 years",
    description:
      "Advanced study in IT management, enterprise systems, and emerging technologies.",
  },
];

async function pushPrograms() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    // Clear existing programs
    await Program.deleteMany({});
    console.log("Cleared existing programs");

    // Insert new programs
    const programs = await Program.insertMany(samplePrograms);
    console.log("Added sample programs:", programs);

    console.log("Programs pushed successfully!");
  } catch (error) {
    console.error("Error pushing programs:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

pushPrograms();
