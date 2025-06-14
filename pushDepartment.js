const mongoose = require("mongoose");
const Department = require("./models/Department");

// Connect to MongoDB Atlas
const uri =
  "mongodb+srv://aliirtiza859:Irtizaali859.@irtizacluster.l7kp5.mongodb.net/lms_3";

mongoose
  .connect(uri)
  .then(() => {
    console.log("Connected to MongoDB Atlas successfully");
    return pushDepartments();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

const departments = [
  {
    name: "Computer Science",
    code: "CS",
    description:
      "Department of Computer Science focusing on software development, algorithms, and computer systems.",
  },
  {
    name: "Electrical Engineering",
    code: "EE",
    description:
      "Department of Electrical Engineering covering power systems, electronics, and telecommunications.",
  },
  {
    name: "Mechanical Engineering",
    code: "ME",
    description:
      "Department of Mechanical Engineering specializing in design, manufacturing, and thermal systems.",
  },
  {
    name: "Civil Engineering",
    code: "CE",
    description:
      "Department of Civil Engineering focusing on infrastructure, construction, and environmental engineering.",
  },
  {
    name: "Business Administration",
    code: "BA",
    description:
      "Department of Business Administration covering management, marketing, and finance.",
  },
  {
    name: "Mathematics",
    code: "MATH",
    description:
      "Department of Mathematics offering courses in pure and applied mathematics.",
  },
  {
    name: "Physics",
    code: "PHY",
    description:
      "Department of Physics covering classical mechanics, quantum physics, and modern physics.",
  },
  {
    name: "Chemistry",
    code: "CHEM",
    description:
      "Department of Chemistry focusing on organic, inorganic, and physical chemistry.",
  },
  {
    name: "Biology",
    code: "BIO",
    description:
      "Department of Biology covering molecular biology, genetics, and ecology.",
  },
  {
    name: "Psychology",
    code: "PSY",
    description:
      "Department of Psychology focusing on human behavior, cognition, and mental processes.",
  },
  {
    name: "Economics",
    code: "ECO",
    description:
      "Department of Economics covering microeconomics, macroeconomics, and econometrics.",
  },
  {
    name: "English Literature",
    code: "ENG",
    description:
      "Department of English Literature focusing on literary analysis, creative writing, and linguistics.",
  },
  {
    name: "History",
    code: "HIST",
    description:
      "Department of History covering world history, cultural studies, and historical research.",
  },
  {
    name: "Political Science",
    code: "POL",
    description:
      "Department of Political Science focusing on governance, international relations, and public policy.",
  },
  {
    name: "Sociology",
    code: "SOC",
    description:
      "Department of Sociology covering social behavior, cultural studies, and social research.",
  },
  {
    name: "Architecture",
    code: "ARCH",
    description:
      "Department of Architecture focusing on design, urban planning, and sustainable architecture.",
  },
  {
    name: "Fine Arts",
    code: "ART",
    description:
      "Department of Fine Arts covering visual arts, design, and art history.",
  },
  {
    name: "Music",
    code: "MUS",
    description:
      "Department of Music focusing on performance, composition, and music theory.",
  },
  {
    name: "Environmental Science",
    code: "ENV",
    description:
      "Department of Environmental Science covering ecology, conservation, and environmental policy.",
  },
  {
    name: "Information Technology",
    code: "IT",
    description:
      "Department of Information Technology focusing on systems, networks, and digital solutions.",
  },
];

const pushDepartments = async () => {
  try {
    // Clear existing departments
    await Department.deleteMany({});
    console.log("Cleared existing departments");

    // Insert new departments
    const result = await Department.insertMany(departments);
    console.log("Successfully added departments:", result.length);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};
