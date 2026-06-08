export const courses = [
  {
    id: "bio",
    name: "BIO 221",
    title: "Human Anatomy",
    instructor: "Dr. Rivera",
    room: "Science Hall 204",
    grade: 87.6,
    target: 92,
    color: "#55a989",
    weights: [
      { label: "Labs", weight: 25, earned: 88 },
      { label: "Exams", weight: 45, earned: 84 },
      { label: "Homework", weight: 20, earned: 94 },
      { label: "Participation", weight: 10, earned: 91 },
    ],
    assignments: [
      { id: "bio-a1", title: "Muscle Tissue Lab Report", due: "2026-06-05", module: "Muscular System", group: "Labs", type: "Assignment", points: 40, score: null, status: "upcoming", impact: 2.9, submitted: false, comments: true, rubric: true },
      { id: "bio-a2", title: "Nervous System Quiz", due: "2026-06-08", module: "Nervous System", group: "Exams", type: "Quiz", points: 25, score: null, status: "upcoming", impact: 3.5, submitted: false, comments: false, rubric: false },
      { id: "bio-a3", title: "Bone Markings Worksheet", due: "2026-05-28", module: "Skeletal System", group: "Homework", type: "Assignment", points: 15, score: 0, status: "missing", impact: 1.6, submitted: false, comments: true, rubric: false },
      { id: "bio-a4", title: "Microscope Practical Prep", due: "2026-06-01", module: "Lab Skills", group: "Labs", type: "Page", points: 20, score: 18, status: "complete", impact: 1.4, submitted: true, comments: false, rubric: true },
      { id: "bio-a5", title: "Endocrine Reading Notes", due: null, module: "Endocrine System", group: "Homework", type: "Reading", points: 10, score: null, status: "undated", impact: 0.6, submitted: false, comments: false, rubric: false },
    ],
    modules: [
      { id: "bio-m1", title: "Skeletal System", items: ["Bone Markings Worksheet", "Joint Anatomy Page", "Skeletal Lab Slides"], complete: 2, total: 3 },
      { id: "bio-m2", title: "Muscular System", items: ["Muscle Tissue Lab Report", "Muscle Groups Reading", "Practical Review"], complete: 1, total: 3 },
      { id: "bio-m3", title: "Nervous System", items: ["Nervous System Quiz", "Neuron Diagram Discussion", "Study Guide"], complete: 0, total: 3 },
    ],
    activity: [
      { id: "bio-act1", type: "Feedback", title: "New lab feedback posted", detail: "Dr. Rivera left comments on Microscope Practical Prep.", date: "2026-06-02" },
      { id: "bio-act2", type: "Assignment", title: "Due date updated", detail: "Muscle Tissue Lab Report moved to Jun 5.", date: "2026-06-01" },
    ],
    resources: [
      { id: "bio-r1", title: "Muscle Tissue Slides", type: "PDF", updated: "2026-06-01" },
      { id: "bio-r2", title: "Lab Practical Checklist", type: "DOC", updated: "2026-05-29" },
    ],
  },
  {
    id: "eng",
    name: "ENG 304",
    title: "Writing for Digital Media",
    instructor: "Prof. Shah",
    room: "Humanities 118",
    grade: 94.2,
    target: 95,
    color: "#cf7665",
    weights: [
      { label: "Essays", weight: 45, earned: 96 },
      { label: "Workshops", weight: 25, earned: 92 },
      { label: "Reading Notes", weight: 20, earned: 95 },
      { label: "Participation", weight: 10, earned: 93 },
    ],
    assignments: [
      { id: "eng-a1", title: "Editorial Revision Memo", due: "2026-06-04", module: "Revision Studio", group: "Essays", type: "Assignment", points: 50, score: null, status: "upcoming", impact: 2.2, submitted: false, comments: true, rubric: true },
      { id: "eng-a2", title: "Peer Workshop Packet", due: "2026-06-07", module: "Revision Studio", group: "Workshops", type: "Discussion", points: 20, score: null, status: "upcoming", impact: 1.1, submitted: false, comments: false, rubric: true },
      { id: "eng-a3", title: "Platform Analysis Notes", due: "2026-05-30", module: "Audience and Platforms", group: "Reading Notes", type: "Reading", points: 10, score: 10, status: "complete", impact: 0.7, submitted: true, comments: false, rubric: false },
    ],
    modules: [
      { id: "eng-m1", title: "Audience and Platforms", items: ["Platform Analysis Notes", "Audience Map", "Case Study Reading"], complete: 3, total: 3 },
      { id: "eng-m2", title: "Revision Studio", items: ["Editorial Revision Memo", "Peer Workshop Packet", "Voice Checklist"], complete: 1, total: 3 },
    ],
    activity: [
      { id: "eng-act1", type: "Announcement", title: "Workshop partners assigned", detail: "Check the peer list before class.", date: "2026-06-02" },
      { id: "eng-act2", type: "Grade", title: "Reading notes graded", detail: "Platform Analysis Notes received 10/10.", date: "2026-05-31" },
    ],
    resources: [
      { id: "eng-r1", title: "Revision Rubric", type: "PDF", updated: "2026-06-02" },
      { id: "eng-r2", title: "Digital Style Guide", type: "LINK", updated: "2026-05-28" },
    ],
  },
  {
    id: "calc",
    name: "MATH 241",
    title: "Calculus II",
    instructor: "Dr. Coleman",
    room: "Fisher 303",
    grade: 78.4,
    target: 85,
    color: "#5b82c2",
    weights: [
      { label: "Problem Sets", weight: 25, earned: 83 },
      { label: "Quizzes", weight: 20, earned: 76 },
      { label: "Midterms", weight: 35, earned: 74 },
      { label: "Final", weight: 20, earned: 0, remaining: true },
    ],
    assignments: [
      { id: "calc-a1", title: "Series Convergence Set", due: "2026-06-03", module: "Infinite Series", group: "Problem Sets", type: "Assignment", points: 30, score: null, status: "upcoming", impact: 2.4, submitted: false, comments: false, rubric: false },
      { id: "calc-a2", title: "Integration Techniques Quiz", due: "2026-06-06", module: "Advanced Integration", group: "Quizzes", type: "Quiz", points: 20, score: null, status: "upcoming", impact: 2.8, submitted: false, comments: false, rubric: false },
      { id: "calc-a3", title: "Parametric Curves Practice", due: "2026-05-29", module: "Parametric Equations", group: "Problem Sets", type: "Assignment", points: 20, score: 0, status: "missing", impact: 1.9, submitted: false, comments: true, rubric: false },
    ],
    modules: [
      { id: "calc-m1", title: "Parametric Equations", items: ["Parametric Curves Practice", "Arc Length Notes", "Graphing Lab"], complete: 1, total: 3 },
      { id: "calc-m2", title: "Infinite Series", items: ["Series Convergence Set", "Ratio Test Page", "Power Series Quiz Prep"], complete: 0, total: 3 },
      { id: "calc-m3", title: "Advanced Integration", items: ["Integration Techniques Quiz", "Trig Substitution Notes"], complete: 0, total: 2 },
    ],
    activity: [
      { id: "calc-act1", type: "Grade", title: "Midterm 2 posted", detail: "A 74% was added to the Midterms group.", date: "2026-06-01" },
      { id: "calc-act2", type: "Reminder", title: "Problem set overdue", detail: "Parametric Curves Practice is still missing.", date: "2026-05-30" },
    ],
    resources: [
      { id: "calc-r1", title: "Series Test Flowchart", type: "PDF", updated: "2026-06-02" },
      { id: "calc-r2", title: "Integration Formula Sheet", type: "PDF", updated: "2026-05-26" },
    ],
  },
  {
    id: "hist",
    name: "HIST 180",
    title: "Modern World History",
    instructor: "Prof. Bennett",
    room: "Old Main 12",
    grade: 89.1,
    target: 90,
    color: "#c99d4a",
    weights: [
      { label: "Papers", weight: 35, earned: 90 },
      { label: "Exams", weight: 30, earned: 86 },
      { label: "Discussion", weight: 20, earned: 96 },
      { label: "Reading Checks", weight: 15, earned: 88 },
    ],
    assignments: [
      { id: "hist-a1", title: "Cold War Source Reflection", due: "2026-06-04", module: "Cold War Worlds", group: "Papers", type: "Assignment", points: 35, score: null, status: "upcoming", impact: 1.7, submitted: false, comments: true, rubric: true },
      { id: "hist-a2", title: "Reading Check 9", due: "2026-06-02", module: "Cold War Worlds", group: "Reading Checks", type: "Quiz", points: 10, score: null, status: "upcoming", impact: 0.9, submitted: false, comments: false, rubric: false },
      { id: "hist-a3", title: "Seminar Response", due: "2026-05-31", module: "Postwar Recovery", group: "Discussion", type: "Discussion", points: 12, score: 11, status: "complete", impact: 0.8, submitted: true, comments: true, rubric: false },
    ],
    modules: [
      { id: "hist-m1", title: "Postwar Recovery", items: ["Seminar Response", "Marshall Plan Reading", "Map Activity"], complete: 3, total: 3 },
      { id: "hist-m2", title: "Cold War Worlds", items: ["Reading Check 9", "Cold War Source Reflection", "Primary Source Packet"], complete: 1, total: 3 },
    ],
    activity: [
      { id: "hist-act1", type: "Announcement", title: "Primary source packet posted", detail: "Use the packet for the Cold War reflection.", date: "2026-06-02" },
      { id: "hist-act2", type: "Feedback", title: "Seminar response returned", detail: "Prof. Bennett left discussion notes.", date: "2026-06-01" },
    ],
    resources: [
      { id: "hist-r1", title: "Cold War Primary Sources", type: "PDF", updated: "2026-06-02" },
      { id: "hist-r2", title: "Exam 3 Review Slides", type: "SLIDES", updated: "2026-05-30" },
    ],
  },
];

export const messages = [
  { id: "msg1", courseId: "calc", from: "Dr. Coleman", subject: "Office hours before quiz", body: "I added an extra review slot before the integration techniques quiz.", date: "2026-06-03", unread: true },
  { id: "msg2", courseId: "bio", from: "Dr. Rivera", subject: "Lab report reminder", body: "Remember to include microscope images in the lab report appendix.", date: "2026-06-02", unread: true },
  { id: "msg3", courseId: "eng", from: "Prof. Shah", subject: "Workshop packet expectations", body: "Bring a marked-up draft and two questions for your peer reviewer.", date: "2026-06-01", unread: false },
  { id: "msg4", courseId: "hist", from: "Prof. Bennett", subject: "Source reflection tip", body: "Focus your reflection on one primary source instead of summarizing the whole packet.", date: "2026-05-31", unread: false },
];

export const navItems = ["Dashboard", "Courses", "To-Do", "Grades", "Assignments", "Calendar", "Inbox", "Settings"];
