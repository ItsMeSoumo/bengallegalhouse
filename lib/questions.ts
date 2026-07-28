import { Question } from "./types";

// ── 30 Legal MCQs — Indian Law ──────────────────────────────────────────────

export const questions: Question[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTITUTIONAL LAW (Questions 1–6)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 1,
    question:
      "Which Article of the Indian Constitution guarantees the Right to Equality?",
    options: ["Article 12", "Article 14", "Article 19", "Article 21"],
    correctAnswer: 1,
    subject: "Constitutional Law",
    explanation:
      "Article 14 states: 'The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.'",
  },
  {
    id: 2,
    question:
      "The concept of 'Basic Structure' of the Constitution was propounded in which landmark case?",
    options: [
      "Golaknath v. State of Punjab",
      "Kesavananda Bharati v. State of Kerala",
      "Minerva Mills v. Union of India",
      "Maneka Gandhi v. Union of India",
    ],
    correctAnswer: 1,
    subject: "Constitutional Law",
    explanation:
      "In Kesavananda Bharati v. State of Kerala (1973), the Supreme Court held that Parliament cannot alter the basic structure of the Constitution.",
  },
  {
    id: 3,
    question:
      "Which Part of the Indian Constitution deals with Fundamental Rights?",
    options: ["Part II", "Part III", "Part IV", "Part V"],
    correctAnswer: 1,
    subject: "Constitutional Law",
    explanation:
      "Part III (Articles 12–35) of the Indian Constitution deals with Fundamental Rights.",
  },
  {
    id: 4,
    question:
      "The 42nd Amendment to the Indian Constitution is known as?",
    options: [
      "Mini Constitution",
      "Basic Structure Amendment",
      "Fundamental Rights Amendment",
      "Judicial Reform Amendment",
    ],
    correctAnswer: 0,
    subject: "Constitutional Law",
    explanation:
      "The 42nd Amendment (1976) is called the 'Mini Constitution' because it made extensive changes to the Constitution.",
  },
  {
    id: 5,
    question:
      "Right to Education under Article 21A was inserted by which Constitutional Amendment?",
    options: [
      "84th Amendment",
      "86th Amendment",
      "91st Amendment",
      "93rd Amendment",
    ],
    correctAnswer: 1,
    subject: "Constitutional Law",
    explanation:
      "The 86th Amendment Act, 2002 inserted Article 21A making education a fundamental right for children aged 6–14.",
  },
  {
    id: 6,
    question:
      "Which Article empowers the President of India to declare a National Emergency?",
    options: ["Article 352", "Article 356", "Article 360", "Article 365"],
    correctAnswer: 0,
    subject: "Constitutional Law",
    explanation:
      "Article 352 empowers the President to declare National Emergency on grounds of war, external aggression, or armed rebellion.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INDIAN PENAL CODE (Questions 7–12)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 7,
    question:
      "Under the Indian Penal Code, what is the maximum punishment for murder under Section 302?",
    options: [
      "Life imprisonment only",
      "Death or life imprisonment",
      "14 years imprisonment",
      "10 years imprisonment",
    ],
    correctAnswer: 1,
    subject: "Indian Penal Code",
    explanation:
      "Section 302 IPC provides for punishment of death or imprisonment for life, and fine, for murder.",
  },
  {
    id: 8,
    question: "Which section of IPC defines 'Theft'?",
    options: ["Section 378", "Section 383", "Section 390", "Section 403"],
    correctAnswer: 0,
    subject: "Indian Penal Code",
    explanation:
      "Section 378 IPC defines theft as dishonestly taking any movable property out of the possession of any person without that person's consent.",
  },
  {
    id: 9,
    question:
      "The right of private defence of the body extends to causing death under which section of IPC?",
    options: ["Section 96", "Section 97", "Section 100", "Section 102"],
    correctAnswer: 2,
    subject: "Indian Penal Code",
    explanation:
      "Section 100 IPC lists situations where the right of private defence extends to causing death.",
  },
  {
    id: 10,
    question: "Section 498A of IPC deals with?",
    options: [
      "Dowry death",
      "Cruelty by husband or relatives of husband",
      "Bigamy",
      "Adultery",
    ],
    correctAnswer: 1,
    subject: "Indian Penal Code",
    explanation:
      "Section 498A deals with cruelty by husband or relatives of husband towards a married woman.",
  },
  {
    id: 11,
    question:
      "Under IPC, 'Culpable Homicide amounting to Murder' is defined in?",
    options: ["Section 299", "Section 300", "Section 301", "Section 304"],
    correctAnswer: 1,
    subject: "Indian Penal Code",
    explanation:
      "Section 300 defines when culpable homicide amounts to murder.",
  },
  {
    id: 12,
    question: "Which section of IPC deals with criminal defamation?",
    options: ["Section 499", "Section 500", "Section 503", "Section 506"],
    correctAnswer: 0,
    subject: "Indian Penal Code",
    explanation:
      "Section 499 defines defamation and Section 500 provides punishment for it.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CrPC — Criminal Procedure Code (Questions 13–17)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 13,
    question:
      "Under CrPC, which section provides for the First Information Report (FIR)?",
    options: ["Section 151", "Section 154", "Section 161", "Section 164"],
    correctAnswer: 1,
    subject: "CrPC",
    explanation:
      "Section 154 CrPC deals with information in cognizable cases (FIR).",
  },
  {
    id: 14,
    question:
      "Anticipatory Bail is provided under which section of CrPC?",
    options: ["Section 436", "Section 437", "Section 438", "Section 439"],
    correctAnswer: 2,
    subject: "CrPC",
    explanation:
      "Section 438 CrPC provides for the direction for grant of bail to a person apprehending arrest (anticipatory bail).",
  },
  {
    id: 15,
    question:
      "Section 125 of CrPC deals with?",
    options: [
      "Maintenance of wives, children, and parents",
      "Power to grant bail",
      "Search warrants",
      "Power of arrest",
    ],
    correctAnswer: 0,
    subject: "CrPC",
    explanation:
      "Section 125 CrPC provides for order of maintenance of wives, children, and parents who are unable to maintain themselves.",
  },
  {
    id: 16,
    question:
      "Which section of CrPC empowers a Magistrate to order a person to execute a bond for keeping the peace?",
    options: ["Section 106", "Section 107", "Section 110", "Section 144"],
    correctAnswer: 1,
    subject: "CrPC",
    explanation:
      "Section 107 CrPC deals with security for keeping the peace in other cases.",
  },
  {
    id: 17,
    question:
      "The provision regarding 'Plea Bargaining' was introduced in CrPC under?",
    options: ["Chapter XVIA", "Chapter XXIA", "Chapter XXV", "Chapter XXVIII"],
    correctAnswer: 1,
    subject: "CrPC",
    explanation:
      "Chapter XXIA (Sections 265A to 265L) of CrPC, introduced by the Criminal Law (Amendment) Act, 2005, deals with Plea Bargaining.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CPC — Civil Procedure Code (Questions 18–22)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 18,
    question:
      "Under CPC, which Order deals with 'Temporary Injunctions and Interlocutory Orders'?",
    options: ["Order 38", "Order 39", "Order 40", "Order 41"],
    correctAnswer: 1,
    subject: "CPC",
    explanation:
      "Order 39 of CPC deals with temporary injunctions and interlocutory orders.",
  },
  {
    id: 19,
    question: "Res Judicata is defined under which section of CPC?",
    options: ["Section 9", "Section 10", "Section 11", "Section 12"],
    correctAnswer: 2,
    subject: "CPC",
    explanation:
      "Section 11 of CPC embodies the doctrine of Res Judicata — no court shall try any suit or issue in which the matter has been directly and substantially in issue in a former suit.",
  },
  {
    id: 20,
    question: "Which section of CPC deals with 'Suits by or against the Government'?",
    options: ["Section 79", "Section 80", "Section 82", "Section 84"],
    correctAnswer: 1,
    subject: "CPC",
    explanation:
      "Section 80 CPC requires a prior notice of at least two months before instituting a suit against the Government.",
  },
  {
    id: 21,
    question:
      "The concept of 'Set-off' in CPC is dealt with under?",
    options: ["Order 6", "Order 7", "Order 8 Rule 6", "Order 9"],
    correctAnswer: 2,
    subject: "CPC",
    explanation:
      "Order 8 Rule 6 of CPC deals with the concept of legal set-off.",
  },
  {
    id: 22,
    question:
      "Appeal from original decrees under CPC is governed by?",
    options: ["Order 39", "Order 41", "Order 43", "Section 96"],
    correctAnswer: 3,
    subject: "CPC",
    explanation:
      "Section 96 CPC provides for appeal from original decrees.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INDIAN EVIDENCE ACT (Questions 23–26)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 23,
    question:
      "Under the Indian Evidence Act, 'Admission' is defined in which section?",
    options: ["Section 17", "Section 21", "Section 24", "Section 27"],
    correctAnswer: 0,
    subject: "Indian Evidence Act",
    explanation:
      "Section 17 of the Indian Evidence Act defines admission as a statement, oral or documentary, which suggests any inference as to any fact in issue or relevant fact.",
  },
  {
    id: 24,
    question:
      "The concept of 'Dying Declaration' is covered under which section of the Indian Evidence Act?",
    options: ["Section 30", "Section 32", "Section 33", "Section 35"],
    correctAnswer: 1,
    subject: "Indian Evidence Act",
    explanation:
      "Section 32 deals with statements of relevant fact by a person who is dead or cannot be found (dying declaration).",
  },
  {
    id: 25,
    question:
      "Section 65B of the Indian Evidence Act deals with?",
    options: [
      "Oral evidence",
      "Documentary evidence",
      "Admissibility of electronic records",
      "Expert opinion",
    ],
    correctAnswer: 2,
    subject: "Indian Evidence Act",
    explanation:
      "Section 65B provides for admissibility of electronic records, requiring a certificate for computer output to be admissible.",
  },
  {
    id: 26,
    question:
      "Under the Indian Evidence Act, burden of proof lies on?",
    options: [
      "The plaintiff always",
      "The defendant always",
      "The person who asserts a fact",
      "The judge's discretion",
    ],
    correctAnswer: 2,
    subject: "Indian Evidence Act",
    explanation:
      "Section 101 states that whoever desires any court to give judgment as to any legal right dependent on the existence of facts must prove that those facts exist.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTRACT ACT & FAMILY LAW (Questions 27–30)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 27,
    question:
      "Under the Indian Contract Act, 1872, a contract made by a minor is?",
    options: ["Valid", "Voidable", "Void ab initio", "Illegal"],
    correctAnswer: 2,
    subject: "Contract Act",
    explanation:
      "As held in Mohiri Bibi v. Dharmodas Ghose (1903), a contract with a minor is void ab initio.",
  },
  {
    id: 28,
    question:
      "Section 73 of the Indian Contract Act deals with?",
    options: [
      "Penalty for breach of contract",
      "Compensation for loss caused by breach",
      "Liquidated damages",
      "Specific performance",
    ],
    correctAnswer: 1,
    subject: "Contract Act",
    explanation:
      "Section 73 provides for compensation for loss or damage caused by breach of contract.",
  },
  {
    id: 29,
    question:
      "Under the Hindu Marriage Act, 1955, the minimum age for marriage of a girl is?",
    options: ["16 years", "18 years", "21 years", "14 years"],
    correctAnswer: 1,
    subject: "Family Law",
    explanation:
      "Section 5(iii) of the Hindu Marriage Act, 1955 prescribes the minimum age for marriage as 18 years for the bride and 21 years for the bridegroom.",
  },
  {
    id: 30,
    question:
      "Which section of the Muslim Personal Law (Shariat) Application Act, 1937 applies Muslim personal law to Muslims in India?",
    options: ["Section 1", "Section 2", "Section 3", "Section 4"],
    correctAnswer: 1,
    subject: "Family Law",
    explanation:
      "Section 2 of the Shariat Application Act states that in matters of personal law, the rule of decision shall be Muslim personal law.",
  },
];
