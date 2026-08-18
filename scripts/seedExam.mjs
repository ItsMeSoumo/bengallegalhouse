import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore";
import * as fs from "fs";
import * as path from "path";

// ── Read .env.local manually for node script ────────────────────────────────
const envPath = path.resolve(process.cwd(), ".env.local");
let envConfig = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...values] = trimmed.split("=");
      if (key && values.length > 0) {
        envConfig[key.trim()] = values.join("=").trim();
      }
    }
  });
}

const firebaseConfig = {
  apiKey: envConfig.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: envConfig.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envConfig.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envConfig.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: envConfig.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("🔥 Connecting to Firebase Project:", firebaseConfig.projectId);

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// ── Class 7 & 8 GK Question Set (25 Questions) ──────────────────────────────
const class7_8_Questions = [
  {
    id: 1,
    question: "Which planet in our solar system is known as the 'Red Planet'?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    subject: "Science",
    explanation: "Mars appears red because of the iron oxide (rust) on its surface."
  },
  {
    id: 2,
    question: "What is the capital city of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
    correctAnswer: 2,
    subject: "Geography",
    explanation: "Canberra is the federal capital of Australia, chosen as a compromise between Sydney and Melbourne."
  },
  {
    id: 3,
    question: "Who is known as the 'Father of the Indian Constitution'?",
    options: ["Mahatma Gandhi", "Dr. B. R. Ambedkar", "Jawaharlal Nehru", "Dr. Rajendra Prasad"],
    correctAnswer: 1,
    subject: "History & Civics",
    explanation: "Dr. B. R. Ambedkar was the Chairman of the Drafting Committee of the Indian Constitution."
  },
  {
    id: 4,
    question: "Which is the largest and deepest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctAnswer: 3,
    subject: "Geography",
    explanation: "The Pacific Ocean is the largest and deepest ocean, covering more than 30% of the Earth's surface."
  },
  {
    id: 5,
    question: "What is the powerhouse of the cell in biology?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Cytoplasm"],
    correctAnswer: 2,
    subject: "Science",
    explanation: "Mitochondria generate most of the chemical energy (ATP) needed by the cell."
  },
  {
    id: 6,
    question: "Which Indian state has the highest literacy rate according to recent census data?",
    options: ["Tamil Nadu", "Kerala", "Maharashtra", "Himachal Pradesh"],
    correctAnswer: 1,
    subject: "General Knowledge",
    explanation: "Kerala consistently ranks first in India with a literacy rate above 94%."
  },
  {
    id: 7,
    question: "Which gas is present in the highest percentage in the Earth's atmosphere?",
    options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
    correctAnswer: 2,
    subject: "Science",
    explanation: "Nitrogen makes up approximately 78% of Earth's atmosphere."
  },
  {
    id: 8,
    question: "Who invented the telephone in 1876?",
    options: ["Thomas Edison", "Alexander Graham Bell", "Nikola Tesla", "Guglielmo Marconi"],
    correctAnswer: 1,
    subject: "Inventions",
    explanation: "Alexander Graham Bell was awarded the first U.S. patent for the telephone."
  },
  {
    id: 9,
    question: "Which is the longest river in the world?",
    options: ["Amazon River", "Nile River", "Yangtze River", "Mississippi River"],
    correctAnswer: 1,
    subject: "Geography",
    explanation: "The Nile River in Africa is traditionally recognized as the longest river (approx 6,650 km)."
  },
  {
    id: 10,
    question: "How many Fundamental Rights are guaranteed by the Constitution of India?",
    options: ["5", "6", "7", "8"],
    correctAnswer: 1,
    subject: "Civics",
    explanation: "There are 6 Fundamental Rights: Right to Equality, Freedom, against Exploitation, Freedom of Religion, Cultural & Educational Rights, and Constitutional Remedies."
  },
  {
    id: 11,
    question: "Which organ in the human body produces insulin?",
    options: ["Liver", "Kidney", "Pancreas", "Stomach"],
    correctAnswer: 2,
    subject: "Science",
    explanation: "The pancreas produces insulin, which regulates blood glucose levels."
  },
  {
    id: 12,
    question: "In which year did India launch its historic Chandrayaan-3 mission that landed near the lunar South Pole?",
    options: ["2021", "2022", "2023", "2024"],
    correctAnswer: 2,
    subject: "Current Affairs & Space",
    explanation: "ISRO's Chandrayaan-3 successfully touched down on August 23, 2023."
  },
  {
    id: 13,
    question: "What is the chemical symbol for Gold?",
    options: ["Ag", "Au", "Fe", "Gd"],
    correctAnswer: 1,
    subject: "Science",
    explanation: "Au comes from the Latin word 'Aurum', meaning shining dawn."
  },
  {
    id: 14,
    question: "Who was the first woman Prime Minister of India?",
    options: ["Sarojini Naidu", "Indira Gandhi", "Pratibha Patil", "Sushma Swaraj"],
    correctAnswer: 1,
    subject: "History",
    explanation: "Indira Gandhi served as Prime Minister from 1966 to 1977 and 1980 to 1984."
  },
  {
    id: 15,
    question: "Which vitamin is synthesized in our body with the help of sunlight?",
    options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"],
    correctAnswer: 3,
    subject: "Science",
    explanation: "Sunlight triggers the synthesis of Vitamin D in human skin."
  },
  {
    id: 16,
    question: "What is the national animal of India?",
    options: ["Asian Lion", "Royal Bengal Tiger", "Indian Elephant", "Snow Leopard"],
    correctAnswer: 1,
    subject: "General Knowledge",
    explanation: "The Royal Bengal Tiger (Panthera tigris tigris) is the national animal of India."
  },
  {
    id: 17,
    question: "Which layer of the atmosphere protects the Earth from harmful ultraviolet (UV) rays?",
    options: ["Troposphere", "Ozone Layer", "Mesosphere", "Thermosphere"],
    correctAnswer: 1,
    subject: "Environment",
    explanation: "The Ozone Layer in the stratosphere absorbs most of the Sun's harmful ultraviolet radiation."
  },
  {
    id: 18,
    question: "Who wrote the famous Indian National Anthem 'Jana Gana Mana'?",
    options: ["Bankim Chandra Chatterjee", "Rabindranath Tagore", "Sarojini Naidu", "Subhash Chandra Bose"],
    correctAnswer: 1,
    subject: "Literature & Culture",
    explanation: "Rabindranath Tagore composed the national anthem in Bengali, which was later adopted in Hindi."
  },
  {
    id: 19,
    question: "What is the boiling point of pure water at standard sea-level pressure?",
    options: ["90°C", "100°C", "110°C", "120°C"],
    correctAnswer: 1,
    subject: "Science",
    explanation: "Pure water boils at 100 degrees Celsius (212 degrees Fahrenheit) at 1 atmosphere of pressure."
  },
  {
    id: 20,
    question: "Which device is known as the 'Brain of the Computer'?",
    options: ["RAM", "Hard Disk", "CPU (Central Processing Unit)", "Monitor"],
    correctAnswer: 2,
    subject: "Computers",
    explanation: "The CPU performs the fundamental arithmetic, logic, and control operations."
  },
  {
    id: 21,
    question: "Which monument is located in Agra and is one of the Seven Wonders of the World?",
    options: ["Qutub Minar", "Red Fort", "Taj Mahal", "Hawa Mahal"],
    correctAnswer: 2,
    subject: "History & Monuments",
    explanation: "The Taj Mahal was built by Mughal emperor Shah Jahan in memory of his wife Mumtaz Mahal."
  },
  {
    id: 22,
    question: "How many players are on the field in a standard Cricket team?",
    options: ["9", "10", "11", "12"],
    correctAnswer: 2,
    subject: "Sports",
    explanation: "Each cricket team consists of 11 active players on the field."
  },
  {
    id: 23,
    question: "Which is the smallest continent by land area in the world?",
    options: ["Europe", "Australia", "Antarctica", "South America"],
    correctAnswer: 1,
    subject: "Geography",
    explanation: "Australia (Oceania) is the smallest continent on Earth by land area."
  },
  {
    id: 24,
    question: "What type of energy is stored in a stretched rubber band?",
    options: ["Kinetic Energy", "Potential Energy", "Thermal Energy", "Chemical Energy"],
    correctAnswer: 1,
    subject: "Science & Physics",
    explanation: "A stretched rubber band stores elastic potential energy."
  },
  {
    id: 25,
    question: "Who is the Supreme Commander of the Indian Armed Forces?",
    options: ["Prime Minister of India", "Chief of Defence Staff", "President of India", "Defence Minister"],
    correctAnswer: 2,
    subject: "Civics",
    explanation: "According to Article 53 of the Constitution, the President is the Supreme Commander of the Armed Forces."
  }
];

const examPapersToSeed = [
  {
    id: "class-7-8-gk-assessment-1",
    title: "Class 7 & 8 General Knowledge Assessment",
    subtitle: "Science, Geography, History, Civics & Space (25 Questions)",
    description: "Comprehensive 25-question General Knowledge assessment paper covering Solar System, Indian Constitution, World Geography, Discoveries, and Sports.",
    totalTimeMinutes: 30,
    marksPerCorrect: 1,
    negativeMarks: 0.25,
    passingPercentage: 40,
    maxAttempts: 2,
    status: "active",
    isPrivate: false,
    questions: class7_8_Questions,
  },
  {
    id: "science-nature-quiz-1",
    title: "Science & Nature Exploration Quiz",
    subtitle: "Junior Science & Ecology Drill (15 Questions)",
    description: "Interactive science assessment covering Biology, Earth Atmosphere, Physics energy concepts, and Chemical elements for Middle School.",
    totalTimeMinutes: 20,
    marksPerCorrect: 1,
    negativeMarks: 0.25,
    passingPercentage: 40,
    maxAttempts: 3,
    status: "active",
    isPrivate: false,
    questions: class7_8_Questions.slice(0, 15),
  },
  {
    id: "history-civics-special-1",
    title: "Indian History & Constitution Challenge",
    subtitle: "Heritage, Freedom Movement & Civics (20 Questions)",
    description: "Focused assessment on Indian National Movement, Fundamental Rights, Parliament, and Historical Monuments.",
    totalTimeMinutes: 25,
    marksPerCorrect: 1,
    negativeMarks: 0.25,
    passingPercentage: 40,
    maxAttempts: 1,
    status: "active",
    isPrivate: false,
    questions: class7_8_Questions.slice(0, 20),
  },
];

async function seed() {
  console.log("\n🌱 Starting Database Seeding...");

  // 1. Clean up old demo CULET papers if present
  const snap = await getDocs(collection(db, "exam_papers"));
  console.log(`📋 Found ${snap.docs.length} existing papers in Firestore.`);

  for (const d of snap.docs) {
    if (d.id.startsWith("culet-") || d.id.startsWith("legal-aptitude") || d.id.startsWith("gk-current")) {
      console.log(`🗑️ Deleting old demo paper: ${d.id}`);
      await deleteDoc(d.ref);
    }
  }

  // 2. Insert new Class 7-8 GK papers
  for (const paper of examPapersToSeed) {
    console.log(`✨ Seeding paper '${paper.id}' (${paper.questions.length} questions)...`);
    await setDoc(doc(db, "exam_papers", paper.id), paper, { merge: true });
  }

  console.log("\n✅ Database Seeding Completed Successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding Error:", err);
  process.exit(1);
});
