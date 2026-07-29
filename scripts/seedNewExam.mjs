import fs from "node:fs";
import path from "node:path";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// 1. Manually parse .env.local variables into process.env
const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = (match[2] || "").trim();
      // Remove surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

// 2. Setup Firebase Config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.error("❌ Firebase configuration not found in .env.local!");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. Define 100 Questions for the Hard Mixed Set Mock Exam
const questions = [
  {
    id: 1,
    question: "Choose the synonym of 'Vociferous.'",
    options: ["Silent", "Loud", "Calm", "Timid"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 2,
    question: "Which Schedule of the Indian Constitution deals with the distribution of powers between the Union and States?",
    options: ["Fifth Schedule", "Sixth Schedule", "Seventh Schedule", "Eighth Schedule"],
    subject: "General Knowledge",
    correctAnswer: 2
  },
  {
    id: 3,
    question: "Who became the Interim President of FIDE (International Chess Federation) in July 2026?",
    options: ["Magnus Carlsen", "Viswanathan Anand", "Garry Kasparov", "Arkady Dvorkovich"],
    subject: "Current Affairs",
    correctAnswer: 3
  },
  {
    id: 4,
    question: "Choose the antonym of 'Meticulous.'",
    options: ["Careful", "Careless", "Precise", "Thorough"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 5,
    question: "A sum of ₹15,000 amounts to ₹19,965 in 3 years at compound interest, compounded annually. Find the rate of interest.",
    options: ["9%", "10%", "11%", "12%"],
    subject: "Quantitative Aptitude",
    correctAnswer: 1
  },
  {
    id: 6,
    question: "The Tropic of Cancer does NOT pass through which of the following Indian states?",
    options: ["Gujarat", "Rajasthan", "Punjab", "West Bengal"],
    subject: "General Knowledge",
    correctAnswer: 2
  },
  {
    id: 7,
    question: "Choose the correctly spelt word.",
    options: ["Occurence", "Occurrence", "Ocurrence", "Occurrance"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 8,
    question: "India won the ICC Men's T20 World Cup 2026 by defeating which team in the final?",
    options: ["Australia", "South Africa", "New Zealand", "England"],
    subject: "Current Affairs",
    correctAnswer: 2
  },
  {
    id: 9,
    question: "Principle: A person is liable for negligence if he owes a duty of care, breaches it, and causes damage. Facts: A doctor fails to sterilise equipment, causing infection to a patient. Is the doctor liable?",
    options: [
      "Yes, negligence is established",
      "No, doctors are immune from suit",
      "No, the patient assumed the risk",
      "Yes, but only if it was intentional"
    ],
    subject: "Legal Aptitude",
    correctAnswer: 0
  },
  {
    id: 10,
    question: "Who was the first Speaker of the Lok Sabha?",
    options: ["G.V. Mavalankar", "Neelam Sanjiva Reddy", "Hukam Singh", "K.S. Hegde"],
    subject: "General Knowledge",
    correctAnswer: 0
  },
  {
    id: 11,
    question: "One-word substitution: 'A person who is difficult to please.'",
    options: ["Pedant", "Fastidious", "Ascetic", "Philanthropist"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 12,
    question: "Two pipes A and B can fill a tank in 12 and 18 hours respectively. Pipe C can empty it in 9 hours. If all three are opened together, how long will it take to fill the tank?",
    options: ["24 hrs", "30 hrs", "36 hrs", "42 hrs"],
    subject: "Quantitative Aptitude",
    correctAnswer: 2
  },
  {
    id: 13,
    question: "Which IPL team won the Indian Premier League 2026 title?",
    options: ["Gujarat Titans", "Royal Challengers Bengaluru", "Chennai Super Kings", "Mumbai Indians"],
    subject: "Current Affairs",
    correctAnswer: 1
  },
  {
    id: 14,
    question: "Choose the correctly punctuated sentence.",
    options: [
      "Its a beautiful day, isn't it.",
      "It's a beautiful day, isn't it?",
      "Its' a beautiful day isn't it?",
      "It's a beautiful day, isnt it?"
    ],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 15,
    question: "The Battle of Plassey was fought in which year?",
    options: ["1757", "1764", "1857", "1761"],
    subject: "General Knowledge",
    correctAnswer: 0
  },
  {
    id: 16,
    question: "India will host the 18th BRICS Summit 2026 in which city?",
    options: ["Mumbai", "New Delhi", "Bengaluru", "Ahmedabad"],
    subject: "Current Affairs",
    correctAnswer: 1
  },
  {
    id: 17,
    question: "Find the error in the sentence: 'Neither of the two boys have done their homework.'",
    options: ["Neither", "have done", "their", "No error"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 18,
    question: "Idiom: 'To bell the cat' means—",
    options: ["To take a risky initiative", "To flatter someone", "To avoid danger", "To betray a friend"],
    subject: "English",
    correctAnswer: 0
  },
  {
    id: 19,
    question: "Which vitamin is synthesised in human skin upon exposure to sunlight?",
    options: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"],
    subject: "General Knowledge",
    correctAnswer: 2
  },
  {
    id: 20,
    question: "Choose the correct passive voice of 'They are building a new bridge.'",
    options: [
      "A new bridge is being built by them.",
      "A new bridge was built by them.",
      "A new bridge has been built by them.",
      "A new bridge is built by them."
    ],
    subject: "English",
    correctAnswer: 0
  },
  {
    id: 21,
    question: "The Reserve Bank of India received government approval to conduct field trials of polymer banknotes in which denominations?",
    options: ["₹50 and ₹100", "₹10 and ₹20", "₹200 and ₹500", "₹5 and ₹10"],
    subject: "Current Affairs",
    correctAnswer: 1
  },
  {
    id: 22,
    question: "Change into indirect speech: He said, 'I am going to Delhi tomorrow.'",
    options: [
      "He said that he was going to Delhi the next day.",
      "He said that he is going to Delhi tomorrow.",
      "He said that he was going to Delhi tomorrow.",
      "He told that he was going to Delhi the following day."
    ],
    subject: "English",
    correctAnswer: 0
  },
  {
    id: 23,
    question: "The headquarters of the International Monetary Fund (IMF) is located in—",
    options: ["New York", "Geneva", "Washington D.C.", "London"],
    subject: "General Knowledge",
    correctAnswer: 2
  },
  {
    id: 24,
    question: "Choose the correctly spelt word.",
    options: ["Rhythm", "Rhythem", "Rythm", "Rhythym"],
    subject: "English",
    correctAnswer: 0
  },
  {
    id: 25,
    question: "In a code, MOUNTAIN is written as NPVOUBJO. How will RIVER be coded in the same language?",
    options: ["SJWFS", "SJWFT", "SKWFS", "SJVFS"],
    subject: "Logical Reasoning",
    correctAnswer: 0
  },
  {
    id: 26,
    question: "The average age of A, B and C is 27 years. If the average age of A and C is 24 years, find B's age.",
    options: ["30", "31", "32", "33"],
    subject: "Quantitative Aptitude",
    correctAnswer: 3
  },
  {
    id: 27,
    question: "The 2026 Commonwealth Games were held in which city?",
    options: ["Birmingham", "Glasgow", "Victoria", "Gold Coast"],
    subject: "Current Affairs",
    correctAnswer: 1
  },
  {
    id: 28,
    question: "Which Indian Constitutional Amendment is associated with the anti-defection law?",
    options: ["42nd", "44th", "52nd", "61st"],
    subject: "General Knowledge",
    correctAnswer: 2
  },
  {
    id: 29,
    question: "Choose the synonym of 'Pernicious.'",
    options: ["Harmful", "Beneficial", "Harmless", "Mild"],
    subject: "English",
    correctAnswer: 0
  },
  {
    id: 30,
    question: "A mixture contains milk and water in the ratio 5:3. If 16 litres of water is added, the ratio becomes 5:7. Find the initial quantity of milk.",
    options: ["15 L", "18 L", "20 L", "24 L"],
    subject: "Quantitative Aptitude",
    correctAnswer: 2
  },
  {
    id: 31,
    question: "The Radcliffe Line demarcates the border between India and which country/countries?",
    options: ["India and China", "India and Pakistan/Bangladesh", "India and Nepal", "India and Myanmar"],
    subject: "General Knowledge",
    correctAnswer: 1
  },
  {
    id: 32,
    question: "Which country won the men's singles title at the 2026 US Open Badminton Championships?",
    options: ["India", "Denmark", "Chinese Taipei", "Indonesia"],
    subject: "Current Affairs",
    correctAnswer: 3
  },
  {
    id: 33,
    question: "Choose the antonym of 'Frugal.'",
    options: ["Thrifty", "Economical", "Extravagant", "Sparing"],
    subject: "English",
    correctAnswer: 2
  },
  {
    id: 34,
    question: "Which is the smallest bone in the human body?",
    options: ["Femur", "Stapes", "Tibia", "Radius"],
    subject: "General Knowledge",
    correctAnswer: 1
  },
  {
    id: 35,
    question: "One-word substitution: 'One who loves and collects books.'",
    options: ["Bibliophile", "Bibliophobe", "Philologist", "Linguist"],
    subject: "English",
    correctAnswer: 0
  },
  {
    id: 36,
    question: "Principle: An agreement without consideration is void, except in certain specified cases. Facts: A promises to gift his watch to B out of natural love and affection, in writing and registered, both being brothers. Is this agreement enforceable?",
    options: [
      "No, since there is no consideration",
      "Yes, as it is written, registered, and made out of natural love and affection between near relations",
      "Yes, because all gifts are always enforceable",
      "No, oral gifts alone are valid"
    ],
    subject: "Legal Aptitude",
    correctAnswer: 1
  },
  {
    id: 37,
    question: "Choose the correct preposition: 'He is averse ___ change.'",
    options: ["to", "from", "of", "with"],
    subject: "English",
    correctAnswer: 0
  },
  {
    id: 38,
    question: "India assumed the BRICS chairmanship for 2026, taking over from which country?",
    options: ["Russia", "China", "Brazil", "South Africa"],
    subject: "Current Affairs",
    correctAnswer: 3
  },
  {
    id: 39,
    question: "A can do a piece of work in 20 days and B in 30 days. They work together for 5 days, then A leaves. In how many more days will B finish the remaining work?",
    options: ["15 days", "16 days", "17.5 days", "18 days"],
    subject: "Quantitative Aptitude",
    correctAnswer: 0
  },
  {
    id: 40,
    question: "Find the error: 'Each of the students have submitted their assignment.'",
    options: ["Each of the students", "have submitted", "their assignment", "No error"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 41,
    question: "The concept of 'Directive Principles of State Policy' in the Indian Constitution was borrowed from—",
    options: ["USA", "UK", "Ireland", "Canada"],
    subject: "General Knowledge",
    correctAnswer: 2
  },
  {
    id: 42,
    question: "Idiom: 'To burn the midnight oil' means—",
    options: ["To waste time", "To work late into the night", "To destroy evidence", "To celebrate late"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 43,
    question: "The 2026 Winter Olympics were hosted by which country?",
    options: ["France", "Italy", "Japan", "South Korea"],
    subject: "Current Affairs",
    correctAnswer: 1
  },
  {
    id: 44,
    question: "Choose the correctly spelt word.",
    options: ["Questionnaire", "Questionaire", "Questionnair", "Questionare"],
    subject: "English",
    correctAnswer: 0
  },
  {
    id: 45,
    question: "Which of the following is the largest gland in the human body?",
    options: ["Pancreas", "Thyroid", "Liver", "Pituitary"],
    subject: "General Knowledge",
    correctAnswer: 2
  },
  {
    id: 46,
    question: "Choose the synonym of 'Laconic.'",
    options: ["Verbose", "Terse", "Elaborate", "Ambiguous"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 47,
    question: "The FIFA World Cup 2026 is being jointly hosted by USA, Mexico and which other country?",
    options: ["Canada", "Argentina", "Brazil", "Germany"],
    subject: "Current Affairs",
    correctAnswer: 0
  },
  {
    id: 48,
    question: "The probability of drawing two aces from a well-shuffled deck of 52 cards without replacement is—",
    options: ["1/121", "1/169", "1/221", "1/225"],
    subject: "Quantitative Aptitude",
    correctAnswer: 2
  },
  {
    id: 49,
    question: "The Sun Temple at Konark is located in which state?",
    options: ["Odisha", "West Bengal", "Tamil Nadu", "Karnataka"],
    subject: "General Knowledge",
    correctAnswer: 0
  },
  {
    id: 50,
    question: "Choose the antonym of 'Nadir.'",
    options: ["Depth", "Bottom", "Zenith", "Low point"],
    subject: "General Knowledge",
    correctAnswer: 2
  },
  {
    id: 51,
    question: "Who launched the PM Family Care Tracker pilot project in June 2026?",
    options: ["Narendra Modi", "Amit Shah", "Nirmala Sitharaman", "Rajnath Singh"],
    subject: "Current Affairs",
    correctAnswer: 0
  },
  {
    id: 52,
    question: "The perimeter of a rectangle is 60 cm and its length is twice its breadth. Find its area.",
    options: ["150 cm²", "175 cm²", "200 cm²", "225 cm²"],
    subject: "Quantitative Aptitude",
    correctAnswer: 0
  },
  {
    id: 53,
    question: "Pointing to a photograph, Rima said, 'She is the daughter of my grandfather's only son.' How is the girl related to Rima?",
    options: ["Mother", "Sister", "Niece", "Cousin"],
    subject: "Logical Reasoning",
    correctAnswer: 1
  },
  {
    id: 54,
    question: "One-word substitution: 'Government by the few.'",
    options: ["Democracy", "Oligarchy", "Autocracy", "Anarchy"],
    subject: "General Knowledge",
    correctAnswer: 1
  },
  {
    id: 55,
    question: "Which Article of the Indian Constitution deals with the abolition of titles?",
    options: ["Article 15", "Article 18", "Article 19", "Article 22"],
    subject: "General Knowledge",
    correctAnswer: 1
  },
  {
    id: 56,
    question: "Choose the correct sentence.",
    options: [
      "She don't like coffee.",
      "She doesn't likes coffee.",
      "She doesn't like coffee.",
      "She not like coffee."
    ],
    subject: "English",
    correctAnswer: 2
  },
  {
    id: 57,
    question: "The theme of India's BRICS Chairship 2026 is built around which four pillars?",
    options: [
      "Peace, Progress, Prosperity, Partnership",
      "Resilience, Innovation, Cooperation, Sustainability",
      "Growth, Equity, Unity, Development",
      "Trade, Technology, Trust, Transformation"
    ],
    subject: "Current Affairs",
    correctAnswer: 1
  },
  {
    id: 58,
    question: "The unit of electrical resistance is—",
    options: ["Ampere", "Volt", "Ohm", "Watt"],
    subject: "General Knowledge",
    correctAnswer: 2
  },
  {
    id: 59,
    question: "Fill in the blank: 'He has been living here ___ 2010.'",
    options: ["for", "since", "from", "during"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 60,
    question: "Who among the following was known as the 'Iron Man of India'?",
    options: ["Jawaharlal Nehru", "Sardar Vallabhbhai Patel", "Bhagat Singh", "Subhas Chandra Bose"],
    subject: "General Knowledge",
    correctAnswer: 1
  },
  {
    id: 61,
    question: "Statements: All pens are books. No book is a table. Some tables are chairs. Conclusions: I. No pen is a table. II. Some chairs are not books.",
    options: ["Only I follows", "Only II follows", "Both I and II follow", "Neither follows"],
    subject: "Logical Reasoning",
    correctAnswer: 0
  },
  {
    id: 62,
    question: "Which Indian athlete won a silver medal in men's high jump at the Commonwealth Games 2026 in Glasgow?",
    options: ["Tejaswin Shankar", "Sarvesh Anil Kushare", "Murali Sreeshankar", "Avinash Sable"],
    subject: "Current Affairs",
    correctAnswer: 1
  },
  {
    id: 63,
    question: "Idiom: 'A red herring' means—",
    options: ["An important clue", "A misleading distraction", "A dangerous animal", "A financial loss"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 64,
    question: "A shopkeeper marks an item 40% above cost price and gives a discount of 25%. Find his profit percentage.",
    options: ["5%", "8%", "10%", "15%"],
    subject: "Quantitative Aptitude",
    correctAnswer: 2
  },
  {
    id: 65,
    question: "CSIR transferred indigenous technologies to industry, including an IoT-enabled monitoring system for which sector, in July 2026?",
    options: ["Urban traffic management", "Rural water services", "Agricultural drone mapping", "Solar grid monitoring"],
    subject: "Current Affairs",
    correctAnswer: 1
  },
  {
    id: 66,
    question: "Which of the following rivers flows through a rift valley?",
    options: ["Ganga", "Narmada", "Godavari", "Brahmaputra"],
    subject: "General Knowledge",
    correctAnswer: 1
  },
  {
    id: 67,
    question: "Choose the synonym of 'Assiduous.'",
    options: ["Lazy", "Diligent", "Careless", "Reluctant"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 68,
    question: "Which organisation formally launched the 18th BRICS Summit's logo and presidency website in January 2026?",
    options: ["Ministry of External Affairs, India", "United Nations", "World Bank", "WTO"],
    subject: "Current Affairs",
    correctAnswer: 0
  },
  {
    id: 69,
    question: "Principle: Theft is the dishonest taking of movable property out of another's possession without consent. Facts: X takes an umbrella from a restaurant genuinely believing it to be his own, but it belongs to Y. Has X committed theft?",
    options: [
      "Yes, because he took another's property",
      "No, because dishonest intention is absent",
      "Yes, but only as a civil wrong",
      "No, because he intended to return it"
    ],
    subject: "Legal Aptitude",
    correctAnswer: 1
  },
  {
    id: 70,
    question: "The Reserve Bank of India was nationalised in which year?",
    options: ["1935", "1947", "1949", "1955"],
    subject: "General Knowledge",
    correctAnswer: 2
  },
  {
    id: 71,
    question: "Choose the antonym of 'Sanguine.'",
    options: ["Optimistic", "Hopeful", "Pessimistic", "Cheerful"],
    subject: "English",
    correctAnswer: 2
  },
  {
    id: 72,
    question: "Which gas is most abundant in the Earth's atmosphere?",
    options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
    subject: "General Knowledge",
    correctAnswer: 2
  },
  {
    id: 73,
    question: "The BRICS Energy Ministers' Meeting 2026, under India's chairship, was held in which city?",
    options: ["Gurugram", "New Delhi", "Hyderabad", "Chandigarh"],
    subject: "Current Affairs",
    correctAnswer: 0
  },
  {
    id: 74,
    question: "Five students J, K, L, M and N sit in a row facing North. K is third to the left of N. L is immediately to the right of K. M sits at one of the extreme ends. J is immediately to the right of L. Who sits immediately to the left of J?",
    options: ["K", "L", "M", "N"],
    subject: "Logical Reasoning",
    correctAnswer: 1
  },
  {
    id: 75,
    question: "The Chola dynasty was particularly renowned for its expertise in which field?",
    options: ["Naval and maritime trade", "Cotton textiles", "Diamond mining", "Iron smelting"],
    subject: "General Knowledge",
    correctAnswer: 0
  },
  {
    id: 76,
    question: "Choose the correctly spelt word.",
    options: ["Millenium", "Millennium", "Milennium", "Millenneum"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 77,
    question: "Which country's president chaired the 17th BRICS Summit held in Rio de Janeiro in 2025, handing over the chairship to India?",
    options: ["Argentina", "Brazil", "Mexico", "Chile"],
    subject: "Current Affairs",
    correctAnswer: 1
  },
  {
    id: 78,
    question: "One-word substitution: 'A person who can speak two languages.'",
    options: ["Polyglot", "Bilingual", "Linguist", "Interpreter"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 79,
    question: "Which of the following is NOT a Fundamental Right under the Indian Constitution today?",
    options: ["Right to Equality", "Right to Property", "Right to Freedom", "Right against Exploitation"],
    subject: "General Knowledge",
    correctAnswer: 1
  },
  {
    id: 80,
    question: "Find the error: 'Between you and I, this is a bad idea.'",
    options: ["Between", "you and I", "this is", "No error"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 81,
    question: "The term 'Bicameral Legislature' refers to a legislature with—",
    options: ["One House", "Two Houses", "Three Houses", "No House"],
    subject: "General Knowledge",
    correctAnswer: 1
  },
  {
    id: 82,
    question: "In the 2026 T20 World Cup final, India defended their title by defeating New Zealand by what margin?",
    options: ["56 runs", "76 runs", "96 runs", "116 runs"],
    subject: "Current Affairs",
    correctAnswer: 1
  },
  {
    id: 83,
    question: "Choose the correct active voice of 'The letter was written by her.'",
    options: [
      "She writes the letter.",
      "She wrote the letter.",
      "She had written the letter.",
      "She has written the letter."
    ],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 84,
    question: "Which planet is known as the 'Red Planet'?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    subject: "General Knowledge",
    correctAnswer: 1
  },
  {
    id: 85,
    question: "A man walks 8 km towards East, turns left and walks 6 km, then turns left again and walks 8 km. How far and in which direction is he from the starting point?",
    options: ["6 km, North", "6 km, South", "10 km, North-East", "14 km, East"],
    subject: "Quantitative Aptitude",
    correctAnswer: 0
  },
  {
    id: 86,
    question: "Choose the correct sentence.",
    options: [
      "If I was you, I would apologize.",
      "If I were you, I would apologize.",
      "If I am you, I would apologize.",
      "If I would be you, I would apologize."
    ],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 87,
    question: "Which Indian para-athlete won gold in the Women's F57 Shot Put event at the Commonwealth Games 2026?",
    options: ["Sharmila Dhankar", "Shilpa Shyla", "Deepa Malik", "Bhavina Patel"],
    subject: "Current Affairs",
    correctAnswer: 0
  },
  {
    id: 88,
    question: "The Government of India Act of which year introduced provincial autonomy?",
    options: ["1919", "1935", "1909", "1947"],
    subject: "General Knowledge",
    correctAnswer: 1
  },
  {
    id: 89,
    question: "Legal maxim: 'Ignorantia juris non excusat' means—",
    options: [
      "Ignorance of fact is an excuse",
      "Ignorance of law is no excuse",
      "Let the buyer beware",
      "The thing speaks for itself"
    ],
    subject: "Legal Aptitude",
    correctAnswer: 1
  },
  {
    id: 90,
    question: "As of the 17th BRICS Summit (2025), which country was the most recently admitted member of BRICS?",
    options: ["Saudi Arabia", "Indonesia", "Argentina", "Vietnam"],
    subject: "Current Affairs",
    correctAnswer: 0
  },
  {
    id: 91,
    question: "Idiom: 'To let the cat out of the bag' means—",
    options: ["To reveal a secret", "To adopt a pet", "To create confusion", "To escape a situation"],
    subject: "English",
    correctAnswer: 0
  },
  {
    id: 92,
    question: "A boat travels 36 km downstream in 3 hours and returns upstream in 6 hours. Find the speed of the boat in still water.",
    options: ["7 km/h", "8 km/h", "9 km/h", "10 km/h"],
    subject: "Quantitative Aptitude",
    correctAnswer: 1
  },
  {
    id: 93,
    question: "Which organ is primarily responsible for producing insulin in the human body?",
    options: ["Liver", "Pancreas", "Kidney", "Spleen"],
    subject: "General Knowledge",
    correctAnswer: 1
  },
  {
    id: 94,
    question: "Choose the synonym of 'Garrulous.'",
    options: ["Silent", "Talkative", "Shy", "Reserved"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 95,
    question: "The first President of India was—",
    options: ["Dr. Rajendra Prasad", "Dr. S. Radhakrishnan", "Zakir Hussain", "V.V. Giri"],
    subject: "General Knowledge",
    correctAnswer: 0
  },
  {
    id: 96,
    question: "Six people sit around a circular table facing the centre with fully determined immediate left/right neighbour relations. What type of reasoning question is this an example of?",
    options: ["Coding-Decoding", "Circular Seating Arrangement", "Blood Relation", "Direction Sense"],
    subject: "Logical Reasoning",
    correctAnswer: 1
  },
  {
    id: 97,
    question: "Which of the following is an offence directly against a person's body, as opposed to property?",
    options: ["Theft", "Murder", "Cheating", "Mischief"],
    subject: "Legal Aptitude",
    correctAnswer: 1
  },
  {
    id: 98,
    question: "Choose the antonym of 'Verbose.'",
    options: ["Wordy", "Concise", "Lengthy", "Elaborate"],
    subject: "English",
    correctAnswer: 1
  },
  {
    id: 99,
    question: "The Government of India, through the Ministry of External Affairs, confirmed the dates of the 18th BRICS Summit for September 2026 following reports in which month?",
    options: ["January 2026", "March 2026", "May 2026", "July 2026"],
    subject: "Current Affairs",
    correctAnswer: 0
  },
  {
    id: 100,
    question: "Choose the grammatically correct sentence.",
    options: [
      "Scarcely he had left when it began to rain.",
      "Scarcely had he left when it began to rain.",
      "Scarcely had he left than it began to rain.",
      "Scarcely he left when it began to rain."
    ],
    subject: "English",
    correctAnswer: 1
  }
];

const newExamPaper = {
  id: "culet-2026-hard-mixed",
  title: "CULET-2026 MOCK TEST — HARD MIXED SET",
  subtitle: "Comprehensive Law Practice Exam",
  description: "Challenge yourself with a fully mixed 100-question practice set covering General Knowledge (25), English (35), Current Affairs (20), Quantitative Aptitude (10), Logical Reasoning (5), and Legal Aptitude (5).",
  totalTimeMinutes: 120,
  marksPerCorrect: 1,
  negativeMarks: 0.25,
  passingPercentage: 40,
  maxAttempts: 1,
  status: "active",
  questions: questions
};

async function seedNewExam() {
  console.log(`\n🥚 Seeding new exam paper '${newExamPaper.title}' directly to Firestore...`);
  try {
    await setDoc(doc(db, "exam_papers", newExamPaper.id), newExamPaper, { merge: true });
    console.log(`✅ Success! Exam paper '${newExamPaper.id}' and its 100 questions have been uploaded to database.\n`);
  } catch (err) {
    console.error("❌ Failed to seed new exam to DB:", err);
  }
}

seedNewExam();
