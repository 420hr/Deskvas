import React, { useEffect, useMemo, useState } from "react";
import { courses, messages, navItems } from "./data.js?v=canvas-pass-20";

const storageKey = "deskcanvas-react-state-v1";
const today = new Date("2026-06-02T12:00:00");
const courseNavItems = ["Home", "Syllabus", "Modules", "Announcements", "Discussions", "Assignments", "People"];
const emptyAssignmentForm = {
  title: "",
  description: "",
  due: "",
  points: "20",
  group: "Homework",
  module: "",
  type: "Assignment",
  published: true,
};
const accounts = {
  avery: {
    id: "avery",
    name: "Avery Reed",
    initials: "AR",
    email: "avery.reed@northlake.edu",
    pronouns: "she/her",
    language: "English",
    timeZone: "America/New_York",
    term: "Spring term",
    role: "student",
    label: "Student",
    courses: ["bio", "eng", "calc", "hist"],
  },
  rivera: {
    id: "rivera",
    name: "Dr. Elena Rivera",
    initials: "ER",
    email: "erivera@northlake.edu",
    pronouns: "she/her",
    language: "English",
    timeZone: "America/New_York",
    term: "Faculty account",
    role: "teacher",
    label: "Teacher",
    courses: ["bio"],
  },
};

function createInitialState() {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  return {
    loggedIn: saved.loggedIn ?? true,
    currentUserId: saved.currentUserId || "avery",
    section: saved.section || "Dashboard",
    selectedCourse: saved.selectedCourse || "bio",
    courseTab: saved.courseTab || "Home",
    theme: saved.theme || "light",
    profileMenuOpen: false,
    gradeSort: saved.gradeSort || "due",
    inboxFilter: saved.inboxFilter || "all",
    targets: saved.targets || Object.fromEntries(courses.map((course) => [course.id, course.target])),
    completed: saved.completed || {},
    selectedDiscussion: saved.selectedDiscussion || null,
    readDiscussions: saved.readDiscussions || {},
    discussionDrafts: saved.discussionDrafts || {},
    discussionReplies: saved.discussionReplies || {},
    announcements: saved.announcements || {},
    announcementEdits: saved.announcementEdits || {},
    deletedAnnouncements: saved.deletedAnnouncements || {},
    announcementForm: saved.announcementForm || { title: "", detail: "" },
    editingAnnouncement: saved.editingAnnouncement || null,
    assignments: saved.assignments || {},
    assignmentEdits: saved.assignmentEdits || {},
    deletedAssignments: saved.deletedAssignments || {},
    assignmentForm: saved.assignmentForm || emptyAssignmentForm,
    editingAssignment: saved.editingAssignment || null,
  };
}

export default function App() {
  const [state, setState] = useState(createInitialState);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    document.documentElement.dataset.theme = state.theme;
  }, [state]);

  const helpers = useMemo(() => createHelpers(state, setState), [state]);
  const course = helpers.getCourse();

  if (!state.loggedIn) {
    return h(LoginPage, { helpers });
  }

  return h(
    "div",
    { className: "app-shell" },
    h(Sidebar, { state, helpers }),
    h(
      "main",
      { className: "desktop" },
      h(Topbar, { state, helpers }),
      h(SectionContent, { course, state, helpers })
    )
  );
}

function createHelpers(state, setState) {
  const update = (patch) => setState((current) => ({ ...current, ...patch }));
  const getCurrentUser = () => accounts[state.currentUserId] || accounts.avery;
  const getCourse = (id = state.selectedCourse) => courses.find((course) => course.id === id) || courses[0];
  const canManageCourse = (course) => {
    const user = getCurrentUser();
    return user.role === "teacher" && user.courses.includes(course.id);
  };
  const assignmentStatus = (assignment) => (state.completed[assignment.id] ? "complete" : assignment.status);
  const normalizeAssignment = (course, assignment) => ({
    ...assignment,
    due: assignment.due || null,
    points: Number(assignment.points || 0),
    impact: Number(assignment.impact ?? 1),
    published: assignment.published ?? true,
    courseId: course.id,
    courseName: course.name,
    courseTitle: course.title,
    courseColor: course.color,
    instructor: course.instructor,
    realStatus: assignmentStatus(assignment),
  });
  const getCourseAssignments = (course) => {
    const base = course.assignments
      .filter((assignment) => !state.deletedAssignments[assignment.id])
      .map((assignment) => normalizeAssignment(course, { ...assignment, ...(state.assignmentEdits[assignment.id] || {}), source: "base" }));
    const custom = (state.assignments[course.id] || [])
      .filter((assignment) => !state.deletedAssignments[assignment.id])
      .map((assignment) => normalizeAssignment(course, { ...assignment, source: "custom" }));
    return [...base, ...custom].filter((assignment) => canManageCourse(course) || assignment.published);
  };
  const getCourseModules = (course) => {
    const modules = course.modules.map((module) => ({ ...module, items: [...module.items] }));
    getCourseAssignments(course).forEach((assignment) => {
      if (!assignment.module) return;
      const existing = modules.find((module) => module.title === assignment.module);
      if (existing && !existing.items.includes(assignment.title)) {
        existing.items.push(assignment.title);
        existing.total += 1;
      } else if (!existing) {
        modules.push({ id: `${course.id}-module-${assignment.module.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, title: assignment.module, items: [assignment.title], complete: assignment.realStatus === "complete" ? 1 : 0, total: 1 });
      }
    });
    return modules;
  };
  const getAssignments = () =>
    courses.flatMap((course) => getCourseAssignments(course));
  const getAnnouncements = (course) => {
    const base = course.activity
      .filter((event) => ["Announcement", "Assignment", "Reminder"].includes(event.type))
      .filter((event) => !state.deletedAnnouncements[event.id])
      .map((event) => ({ ...event, ...(state.announcementEdits[event.id] || {}), source: "base" }));
    const custom = (state.announcements[course.id] || []).filter((event) => !state.deletedAnnouncements[event.id]).map((event) => ({ ...event, source: "custom" }));
    return [...base, ...custom].sort((a, b) => b.date.localeCompare(a.date));
  };

  return {
    getCourse,
    getAssignments,
    getCourseAssignments,
    getCourseModules,
    getCurrentUser,
    canManageCourse,
    getAnnouncements,
    assignmentStatus,
    setSection: (section) => update({ section }),
    setCourse: (selectedCourse) => update({ selectedCourse }),
    openCourse: (selectedCourse) => update({ selectedCourse, section: "Course", courseTab: "Home", selectedDiscussion: null }),
    setCourseTab: (courseTab) => update({ courseTab, selectedDiscussion: courseTab === "Discussions" ? state.selectedDiscussion : null }),
    openDiscussion: (discussionId) =>
      setState((current) => ({
        ...current,
        selectedDiscussion: discussionId,
        readDiscussions: { ...current.readDiscussions, [discussionId]: true },
      })),
    closeDiscussion: () => update({ selectedDiscussion: null }),
    setDiscussionDraft: (discussionId, value) =>
      setState((current) => ({
        ...current,
        discussionDrafts: { ...current.discussionDrafts, [discussionId]: value },
      })),
    addDiscussionReply: (discussionId) =>
      setState((current) => {
        const body = (current.discussionDrafts[discussionId] || "").trim();
        if (!body) return current;
        const user = accounts[current.currentUserId] || accounts.avery;
        const reply = {
          id: `${discussionId}-avery-${Date.now()}`,
          author: user.name,
          role: user.label,
          date: new Date().toISOString().slice(0, 10),
          body,
          children: [],
        };
        return {
          ...current,
          discussionDrafts: { ...current.discussionDrafts, [discussionId]: "" },
          discussionReplies: {
            ...current.discussionReplies,
            [discussionId]: [...(current.discussionReplies[discussionId] || []), reply],
          },
          readDiscussions: { ...current.readDiscussions, [discussionId]: true },
        };
      }),
    openGrades: (selectedCourse) => update({ selectedCourse, section: "Grades" }),
    setGradeSort: (gradeSort) => update({ gradeSort }),
    setInboxFilter: (inboxFilter) => update({ inboxFilter }),
    toggleProfileMenu: () => update({ profileMenuOpen: !state.profileMenuOpen }),
    viewProfile: () => update({ section: "Profile", profileMenuOpen: false }),
    login: (currentUserId) => update({ loggedIn: true, currentUserId, selectedCourse: currentUserId === "rivera" ? "bio" : state.selectedCourse, section: "Dashboard", profileMenuOpen: false }),
    logout: () => update({ loggedIn: false, section: "Dashboard", profileMenuOpen: false }),
    setAnnouncementForm: (field, value) =>
      setState((current) => ({ ...current, announcementForm: { ...current.announcementForm, [field]: value } })),
    startAnnouncementEdit: (announcement) =>
      update({
        editingAnnouncement: announcement.id,
        announcementForm: { title: announcement.title, detail: announcement.detail },
      }),
    cancelAnnouncementEdit: () => update({ editingAnnouncement: null, announcementForm: { title: "", detail: "" } }),
    saveAnnouncement: (courseId) =>
      setState((current) => {
        const title = current.announcementForm.title.trim();
        const detail = current.announcementForm.detail.trim();
        if (!title || !detail) return current;
        const editingId = current.editingAnnouncement;
        if (editingId) {
          const courseAnnouncements = current.announcements[courseId] || [];
          const customExists = courseAnnouncements.some((announcement) => announcement.id === editingId);
          return {
            ...current,
            announcements: customExists
              ? {
                  ...current.announcements,
                  [courseId]: courseAnnouncements.map((announcement) => (announcement.id === editingId ? { ...announcement, title, detail } : announcement)),
                }
              : current.announcements,
            announcementEdits: customExists ? current.announcementEdits : { ...current.announcementEdits, [editingId]: { title, detail } },
            announcementForm: { title: "", detail: "" },
            editingAnnouncement: null,
          };
        }
        const announcement = {
          id: `${courseId}-ann-${Date.now()}`,
          type: "Announcement",
          title,
          detail,
          date: new Date().toISOString().slice(0, 10),
          author: (accounts[current.currentUserId] || accounts.rivera).name,
        };
        return {
          ...current,
          announcements: { ...current.announcements, [courseId]: [announcement, ...(current.announcements[courseId] || [])] },
          announcementForm: { title: "", detail: "" },
          editingAnnouncement: null,
        };
      }),
    deleteAnnouncement: (courseId, announcementId) =>
      setState((current) => {
        const courseAnnouncements = current.announcements[courseId] || [];
        return {
          ...current,
          announcements: {
            ...current.announcements,
            [courseId]: courseAnnouncements.filter((announcement) => announcement.id !== announcementId),
          },
          deletedAnnouncements: { ...current.deletedAnnouncements, [announcementId]: true },
          editingAnnouncement: current.editingAnnouncement === announcementId ? null : current.editingAnnouncement,
          announcementForm: current.editingAnnouncement === announcementId ? { title: "", detail: "" } : current.announcementForm,
        };
      }),
    setAssignmentForm: (field, value) =>
      setState((current) => ({ ...current, assignmentForm: { ...current.assignmentForm, [field]: field === "published" ? Boolean(value) : value } })),
    startAssignmentEdit: (assignment) =>
      update({
        editingAssignment: assignment.id,
        assignmentForm: {
          title: assignment.title,
          description: assignment.description || "",
          due: assignment.due || "",
          points: String(assignment.points || ""),
          group: assignment.group || "Homework",
          module: assignment.module || "",
          type: assignment.type || "Assignment",
          published: assignment.published ?? true,
        },
      }),
    cancelAssignmentEdit: () => update({ editingAssignment: null, assignmentForm: emptyAssignmentForm }),
    saveAssignment: (courseId) =>
      setState((current) => {
        const form = current.assignmentForm;
        const title = form.title.trim();
        if (!title) return current;
        const assignment = {
          title,
          description: form.description.trim(),
          due: form.due || null,
          points: Number(form.points || 0),
          group: form.group || "Homework",
          module: form.module || "Unfiled",
          type: form.type || "Assignment",
          score: null,
          status: "upcoming",
          impact: Math.max(0.5, Math.min(5, Number(form.points || 20) / 12)),
          submitted: false,
          comments: false,
          rubric: false,
          published: form.published,
        };
        const editingId = current.editingAssignment;
        if (editingId) {
          const courseAssignments = current.assignments[courseId] || [];
          const customExists = courseAssignments.some((item) => item.id === editingId);
          return {
            ...current,
            assignments: customExists
              ? { ...current.assignments, [courseId]: courseAssignments.map((item) => (item.id === editingId ? { ...item, ...assignment, id: editingId } : item)) }
              : current.assignments,
            assignmentEdits: customExists ? current.assignmentEdits : { ...current.assignmentEdits, [editingId]: assignment },
            assignmentForm: emptyAssignmentForm,
            editingAssignment: null,
          };
        }
        const newAssignment = { ...assignment, id: `${courseId}-custom-${Date.now()}` };
        return {
          ...current,
          assignments: { ...current.assignments, [courseId]: [newAssignment, ...(current.assignments[courseId] || [])] },
          assignmentForm: emptyAssignmentForm,
          editingAssignment: null,
        };
      }),
    deleteAssignment: (courseId, assignmentId) =>
      setState((current) => ({
        ...current,
        assignments: { ...current.assignments, [courseId]: (current.assignments[courseId] || []).filter((assignment) => assignment.id !== assignmentId) },
        deletedAssignments: { ...current.deletedAssignments, [assignmentId]: true },
        editingAssignment: current.editingAssignment === assignmentId ? null : current.editingAssignment,
        assignmentForm: current.editingAssignment === assignmentId ? emptyAssignmentForm : current.assignmentForm,
      })),
    toggleComplete: (id) => setState((current) => ({ ...current, completed: { ...current.completed, [id]: !current.completed[id] } })),
    setTarget: (courseId, target) => setState((current) => ({ ...current, targets: { ...current.targets, [courseId]: Number(target) } })),
    toggleTheme: () => update({ theme: state.theme === "light" ? "dark" : "light" }),
  };
}

function Sidebar({ state, helpers }) {
  const focus = nextFocus(helpers.getAssignments());
  return h(
    "aside",
    { className: "sidebar" },
    h(
      "div",
      { className: "brand" },
      h("div", { className: "brand-mark" }, "DC"),
      h("div", null, h("strong", null, "DeskCanvas"), h("span", null, "Student command desk"))
    ),
    h(
      "nav",
      null,
      navItems.map((item) =>
        h(
          "button",
          {
            key: item,
            className: `nav-item ${state.section === item ? "active" : ""}`,
            onClick: () => helpers.setSection(item),
          },
          item
        )
      )
    ),
    h(
      "div",
      { className: "desk-note" },
      h("span", null, "Next focus"),
      h("strong", null, focus.title),
      h("small", null, `${focus.courseName} - ${dueLabel(focus.due)}`)
    )
  );
}

function LoginPage({ helpers }) {
  const accountList = [accounts.avery, accounts.rivera];
  return h(
    "main",
    { className: "login-page" },
    h(
      "section",
      { className: "login-card" },
      h("div", { className: "brand-mark login-mark" }, "DC"),
      h("span", { className: "eyebrow" }, "Prototype login"),
      h("h1", null, "Welcome back to DeskCanvas."),
      h("p", null, "Choose a fake account to test student and teacher permissions."),
      h(
        "div",
        { className: "login-options" },
        accountList.map((account) =>
          h(
            "button",
            { key: account.id, className: "login-profile", onClick: () => helpers.login(account.id) },
            h("span", { className: "avatar" }, account.initials),
            h("div", null, h("strong", null, account.name), h("small", null, `${account.label} - ${account.email}`))
          )
        )
      )
    )
  );
}

function Topbar({ state, helpers }) {
  const user = helpers.getCurrentUser();
  return h(
    "header",
    { className: "topbar" },
    h(
      "div",
      null,
      h("span", { className: "eyebrow" }, state.section),
      h("h1", null, headline(state.section))
    ),
    h(
      "div",
      { className: "profile-menu-wrap" },
      h(
        "button",
        {
          className: "student-pill",
          "aria-haspopup": "menu",
          "aria-expanded": state.profileMenuOpen,
          onClick: helpers.toggleProfileMenu,
        },
        h("span", { className: "avatar" }, user.initials),
        h("div", null, h("strong", null, user.name), h("small", null, `${user.label} - ${user.term}`))
      ),
      state.profileMenuOpen
        ? h(
            "div",
            { className: "profile-menu", role: "menu" },
            h("button", { role: "menuitem", onClick: helpers.viewProfile }, "View profile"),
            h("button", { role: "menuitem", onClick: helpers.logout }, "Log out")
          )
        : null
    )
  );
}

function SectionContent({ course, state, helpers }) {
  if (state.section === "Profile") return h(ProfileView, { helpers });
  if (state.section === "Courses") return h(CoursesView, { helpers });
  if (state.section === "Course") return h(CourseDetailView, { course, state, helpers });
  if (state.section === "To-Do") return h(TodoView, { helpers });
  if (state.section === "Grades") return h(GradesView, { course, state, helpers });
  if (state.section === "Assignments") return h(AssignmentsView, { helpers });
  if (state.section === "Calendar") return h(CalendarView, { helpers });
  if (state.section === "Inbox") return h(InboxView, { state, helpers });
  if (state.section === "Settings") return h(SettingsView, { state, helpers });
  return h(DashboardView, { course, state, helpers });
}

function ProfileView({ helpers }) {
  const user = helpers.getCurrentUser();
  const details = [
    ["Name", user.name],
    ["Email", user.email],
    ["Role", user.label],
    ["Pronouns", user.pronouns],
    ["Language", user.language],
    ["Time zone", user.timeZone],
  ];

  return h(
    "section",
    { className: "profile-page" },
    h(
      "div",
      { className: "profile-card" },
      h("span", { className: "avatar profile-avatar" }, user.initials),
      h("div", null, h("span", { className: "eyebrow" }, "Test profile"), h("h2", null, user.name), h("p", null, user.role === "teacher" ? "This fake teacher account can manage BIO 221 announcements." : "This fake student account powers the prototype student dashboard."))
    ),
    h(
      "div",
      { className: "profile-details paper-panel" },
      h("div", { className: "panel-head" }, h("h2", null, "Profile Information"), h("span", null, "Account")),
      details.map(([label, value]) =>
        h("div", { key: label, className: "profile-row" }, h("span", null, label), h("strong", null, value))
      )
    )
  );
}

function DashboardView({ course, state, helpers }) {
  const assignments = helpers.getAssignments();
  const missing = assignments.filter((assignment) => assignment.realStatus === "missing").sort((a, b) => b.impact - a.impact);
  const upcoming = assignments
    .filter((assignment) => assignment.realStatus !== "complete")
    .sort(sortByUrgency)
    .slice(0, 5);
  const todayItems = assignments.filter((assignment) => assignment.realStatus !== "complete" && assignment.due && daysUntil(assignment.due) === 0).sort(sortByUrgency);
  const weekItems = assignments.filter((assignment) => assignment.realStatus !== "complete" && assignment.due && daysUntil(assignment.due) > 0 && daysUntil(assignment.due) <= 7).sort(sortByUrgency).slice(0, 6);
  const activity = courses.flatMap((item) => item.activity.map((event) => ({ ...event, courseName: item.name, courseColor: item.color }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const courseSummaries = courses.map((item) => {
    const courseAssignments = helpers.getCourseAssignments(item);
    const courseMissing = courseAssignments.filter((assignment) => assignment.realStatus === "missing");
    const urgent = courseAssignments.filter((assignment) => assignment.realStatus !== "complete" && assignment.due && daysUntil(assignment.due) <= 3).length;
    return { course: item, assignments: courseAssignments, missing: courseMissing, urgent, status: riskLabel(item, state, helpers) };
  });
  const riskCourses = courseSummaries.filter((item) => item.status !== "On track" || item.missing.length || item.urgent);

  return h(
    "section",
    { className: "dashboard-grid" },
    h("div", { className: "course-rack dashboard-folders" }, courses.map((item) => h(CourseFolder, { key: item.id, course: item, state, helpers }))),
    h(
      "div",
      { className: "paper-panel risk-board" },
      h("div", { className: "panel-head" }, h("h2", null, "Risk Summary"), h("span", null, `${riskCourses.length} signals`)),
      riskCourses.length
        ? riskCourses.slice(0, 4).map(({ course: item, missing: courseMissing, urgent, status }) =>
            h(
              "button",
              { key: item.id, className: "risk-slip", style: { "--accent": item.color }, onClick: () => helpers.openCourse(item.id) },
              h("strong", null, item.name),
              h("span", null, `${status} - ${courseMissing.length} missing - ${urgent} urgent`)
            )
          )
        : h("p", { className: "empty" }, "No urgent risk signals right now.")
    ),
    h(
      "div",
      { className: "paper-panel weekly-planner" },
      h("div", { className: "panel-head" }, h("h2", null, "Today / Next 7 Days"), h("span", null, `${todayItems.length + weekItems.length} tasks`)),
      h("div", { className: "planner-section" }, h("h3", null, "Today"), todayItems.length ? todayItems.map((assignment) => h(AssignmentSlip, { key: assignment.id, assignment, helpers })) : h("p", { className: "empty" }, "Nothing due today.")),
      h("div", { className: "planner-section" }, h("h3", null, "Next 7 Days"), weekItems.length ? weekItems.map((assignment) => h(AssignmentSlip, { key: assignment.id, assignment, helpers })) : h("p", { className: "empty" }, "No upcoming due dates this week."))
    ),
    h(
      "div",
      { className: "paper-panel warning missing-tray" },
      h("div", { className: "panel-head" }, h("h2", null, "Missing Work Tray"), h("span", null, `${missing.length} items`)),
      missing.length ? missing.slice(0, 5).map((assignment) => h(AssignmentSlip, { key: assignment.id, assignment, helpers })) : h("p", { className: "empty" }, "No missing work. The desk is calm.")
    ),
    h(
      "div",
      { className: "paper-panel target-board" },
      h("div", { className: "panel-head" }, h("h2", null, "Target Snapshot"), h("span", null, "All courses")),
      courseSummaries.map(({ course: item, status }) =>
        h(
          "button",
          { key: item.id, className: "target-row", style: { "--accent": item.color }, onClick: () => helpers.openGrades(item.id) },
          h("span", null, item.name),
          h("strong", null, `${item.grade.toFixed(1)} / ${state.targets[item.id]}%`),
          h("em", null, status)
        )
      )
    ),
    h(
      "div",
      { className: "paper-panel activity-panel" },
      h("div", { className: "panel-head" }, h("h2", null, "Recent Feedback & Activity"), h("span", null, "All courses")),
      activity.map((event) => h(ActivityItem, { key: event.id, event }))
    )
  );
}

function CoursesView({ helpers }) {
  return h("section", { className: "binder-grid" }, courses.map((course) => h(CourseBinder, { key: course.id, course, helpers })));
}

function TodoView({ helpers }) {
  const assignments = helpers.getAssignments().filter((assignment) => assignment.realStatus !== "complete").sort(sortByUrgency);
  const groups = [
    ["Overdue", assignments.filter((assignment) => assignment.due && daysUntil(assignment.due) < 0 && assignment.realStatus !== "missing")],
    ["Missing", assignments.filter((assignment) => assignment.realStatus === "missing")],
    ["Upcoming", assignments.filter((assignment) => assignment.due && daysUntil(assignment.due) >= 0 && assignment.realStatus !== "missing")],
    ["Undated", assignments.filter((assignment) => !assignment.due)],
  ];

  return h(
    "section",
    { className: "todo-board" },
    groups.map(([label, items]) =>
      h(
        "div",
        { key: label, className: "paper-panel todo-column" },
        h("div", { className: "panel-head" }, h("h2", null, label), h("span", null, `${items.length} items`)),
        items.length ? items.map((assignment) => h(AssignmentSlip, { key: assignment.id, assignment, helpers })) : h("p", { className: "empty" }, "Nothing here.")
      )
    )
  );
}

function GradesView({ course, state, helpers }) {
  const needed = neededScore(course, state);
  const gradeRows = sortGradeRows(enrichCourseAssignments(course, helpers), state.gradeSort);
  return h(
    "section",
    { className: "grades-layout" },
    h(
      "div",
      { className: "grade-book" },
      h(
        "div",
        { className: "tabs" },
        courses.map((item) =>
          h("button", { key: item.id, className: item.id === course.id ? "active" : "", onClick: () => helpers.setCourse(item.id) }, item.name)
        )
      ),
      h(
        "div",
        { className: "big-grade" },
        h(GradeGauge, { grade: course.grade, color: course.color, large: true }),
        h("div", null, h("h2", null, course.title), h("p", null, `${riskLabel(course, state, helpers)}. Target is set to ${state.targets[course.id]}%.`))
      ),
      h(
        "div",
        { className: "weight-list" },
        course.weights.map((group) =>
          h(
            "div",
            { key: group.label, className: "weight-row" },
            h("span", null, group.label),
            h("div", { className: "rail" }, h("i", { style: { width: `${group.remaining ? 12 : group.earned}%` } })),
            h("strong", null, group.remaining ? "Remaining" : `${group.earned}%`)
          )
        )
      ),
      h(
        "div",
        { className: "grade-detail-head" },
        h("h2", null, "Assignment Details"),
        h(
          "select",
          { value: state.gradeSort, onChange: (event) => helpers.setGradeSort(event.target.value), "aria-label": "Sort grades" },
          h("option", { value: "due" }, "Due date"),
          h("option", { value: "name" }, "Assignment name"),
          h("option", { value: "module" }, "Module"),
          h("option", { value: "group" }, "Assignment group")
        )
      ),
      h("div", { className: "grade-table" }, gradeRows.map((assignment) => h(GradeRow, { key: assignment.id, assignment })))
    ),
    h(
      "div",
      { className: "calculator" },
      h("h2", null, "Target Grade Calculator"),
      h("label", null, "Target grade"),
      h("input", {
        type: "range",
        min: "60",
        max: "100",
        value: state.targets[course.id],
        onChange: (event) => helpers.setTarget(course.id, event.target.value),
      }),
      h("div", { className: "target-readout" }, `${state.targets[course.id]}%`),
      h("p", null, "You need about ", h("strong", null, `${needed.toFixed(1)}%`), " average on remaining weighted work to reach this target."),
      h("button", { className: "primary", onClick: () => helpers.setSection("Assignments") }, "Review active assignments")
    )
  );
}

function AssignmentsView({ helpers }) {
  const assignments = helpers.getAssignments().sort(sortByUrgency);
  return h("section", { className: "assignment-board" }, assignments.map((assignment) => h(AssignmentCard, { key: assignment.id, assignment, helpers })));
}

function CalendarView({ helpers }) {
  const active = helpers.getAssignments().filter((assignment) => assignment.realStatus !== "complete");
  const overdue = active.filter((assignment) => assignment.due && daysUntil(assignment.due) < 0).sort(sortByDue);
  const upcoming = active.filter((assignment) => assignment.due && daysUntil(assignment.due) >= 0).sort(sortByDue);
  return h(
    "section",
    { className: "calendar-board" },
    h(CalendarGroup, { title: "Overdue", assignments: overdue, helpers }),
    h(CalendarGroup, { title: "Upcoming", assignments: upcoming, helpers })
  );
}

function InboxView({ state, helpers }) {
  const filtered = messages
    .filter((message) => state.inboxFilter === "all" || message.courseId === state.inboxFilter)
    .map((message) => ({ ...message, course: courses.find((course) => course.id === message.courseId) }))
    .sort((a, b) => b.date.localeCompare(a.date));
  return h(
    "section",
    { className: "inbox-layout" },
    h(
      "div",
      { className: "paper-panel inbox-filter" },
      h("h2", null, "Inbox"),
      h("button", { className: state.inboxFilter === "all" ? "active" : "", onClick: () => helpers.setInboxFilter("all") }, "All courses"),
      courses.map((course) => h("button", { key: course.id, className: state.inboxFilter === course.id ? "active" : "", onClick: () => helpers.setInboxFilter(course.id) }, course.name))
    ),
    h("div", { className: "message-stack" }, filtered.map((message) => h(MessageCard, { key: message.id, message })))
  );
}

function CourseDetailView({ course, state, helpers }) {
  const assignments = enrichCourseAssignments(course, helpers).sort(sortByUrgency);
  const active = assignments.filter((assignment) => assignment.realStatus !== "complete").slice(0, 4);
  return h(
    "section",
    { className: "course-detail" },
    h(
      "div",
      { className: "course-hero", style: { "--accent": course.color } },
      h("span", { className: "eyebrow" }, course.name),
      h("h2", null, course.title),
      h("p", null, `${course.instructor} - ${course.room}`),
      h(GradeGauge, { grade: course.grade, color: course.color })
    ),
    h(
      "div",
      { className: "course-workspace", style: { "--accent": course.color } },
      h(
        "aside",
        { className: "course-nav", "aria-label": `${course.name} course navigation` },
        courseNavItems.map((item) =>
          h(
            "button",
            {
              key: item,
              className: state.courseTab === item ? "active" : "",
              onClick: () => helpers.setCourseTab(item),
            },
            item
          )
        )
      ),
      h(CourseTabContent, { course, state, helpers, assignments, active })
    )
  );
}

function CourseTabContent({ course, state, helpers, assignments, active }) {
  if (state.courseTab === "Syllabus") return h(CourseSyllabusTab, { course });
  if (state.courseTab === "Modules") return h(CourseModulesTab, { course, helpers });
  if (state.courseTab === "Announcements") return h(CourseAnnouncementsTab, { course, state, helpers });
  if (state.courseTab === "Discussions") return h(CourseDiscussionsTab, { course, state, helpers });
  if (state.courseTab === "Assignments") return h(CourseAssignmentsTab, { course, assignments, state, helpers });
  if (state.courseTab === "People") return h(CoursePeopleTab, { course, helpers });
  return h(CourseHomeTab, { course, helpers, assignments, active });
}

function CourseHomeTab({ course, helpers, assignments, active }) {
  const canManage = helpers.canManageCourse(course);
  return h(
    "div",
    { className: "detail-grid course-tab-panel" },
    h("div", { className: "paper-panel" }, h("div", { className: "panel-head" }, h("h2", null, "Overview"), h("span", null, course.name)), h("p", null, course.syllabus.description), h("div", { className: "mini-meter" }, h(GradeGauge, { grade: course.grade, color: course.color }))),
    h("div", { className: "paper-panel" }, h("div", { className: "panel-head" }, h("h2", null, "Active Work"), h("span", null, `${active.length} items`)), active.map((assignment) => h(AssignmentSlip, { key: assignment.id, assignment, helpers }))),
    h("div", { className: "paper-panel" }, h("div", { className: "panel-head" }, h("h2", null, "Recent Activity"), h("span", null, course.name)), course.activity.map((event) => h(ActivityItem, { key: event.id, event: { ...event, courseName: course.name, courseColor: course.color } }))),
    h("div", { className: "paper-panel" }, h("div", { className: "panel-head" }, h("h2", null, "Upcoming"), h("span", null, `${assignments.length} total`)), assignments.filter((assignment) => assignment.realStatus !== "complete").slice(0, 3).map((assignment) => h(AssignmentSlip, { key: assignment.id, assignment, helpers }))),
    canManage ? h(TeacherCommandPanel, { course, assignments }) : null
  );
}

function TeacherCommandPanel({ course, assignments }) {
  const roster = sampleRoster(course);
  const average = Math.round(roster.reduce((sum, student) => sum + student.grade, 0) / roster.length);
  const unpublished = assignments.filter((assignment) => !assignment.published).length;
  const missing = roster.reduce((sum, student) => sum + student.missing, 0);
  return h(
    "div",
    { className: "paper-panel wide-panel teacher-command" },
    h("div", { className: "panel-head" }, h("h2", null, "Instructor Command Desk"), h("span", null, "BIO 221 tools")),
    h(
      "div",
      { className: "ledger-grid" },
      h("span", null, "Class average"), h("strong", null, `${average}%`),
      h("span", null, "Missing submissions"), h("strong", null, missing),
      h("span", null, "Unpublished items"), h("strong", null, unpublished),
      h("span", null, "Scheduling"), h("strong", null, "Office hours and lab events ready for next pass")
    )
  );
}

function CourseSyllabusTab({ course }) {
  return h(
    "div",
    { className: "detail-grid course-tab-panel" },
    h("div", { className: "paper-panel" }, h("div", { className: "panel-head" }, h("h2", null, "Syllabus"), h("span", null, course.name)), h("p", null, course.syllabus.description), h("div", { className: "syllabus-facts" }, h("div", null, h("span", null, "Instructor"), h("strong", null, course.instructor)), h("div", null, h("span", null, "Location"), h("strong", null, course.room)))),
    h("div", { className: "paper-panel" }, h("div", { className: "panel-head" }, h("h2", null, "Important Dates"), h("span", null, "Term")), h("ul", { className: "course-list" }, course.syllabus.importantDates.map((date) => h("li", { key: date }, date)))),
    h("div", { className: "paper-panel wide-panel" }, h("div", { className: "panel-head" }, h("h2", null, "Grading Weights"), h("span", null, "Policy")), course.weights.map((group) => h("div", { key: group.label, className: "weight-row" }, h("span", null, group.label), h("div", { className: "rail" }, h("i", { style: { width: `${group.weight}%` } })), h("strong", null, `${group.weight}%`))))
  );
}

function CourseModulesTab({ course, helpers }) {
  const modules = helpers.getCourseModules(course);
  return h("div", { className: "paper-panel course-tab-panel" }, h("div", { className: "panel-head" }, h("h2", null, "Modules"), h("span", null, `${modules.length} groups`)), helpers.canManageCourse(course) ? h("div", { className: "role-note module-note" }, h("strong", null, "Teacher module tools"), h("p", null, "New assignment modules appear here automatically. Full drag-to-reorder module editing is queued for the next pass.")) : null, modules.map((module) => h(ModuleCard, { key: module.id, module })));
}

function CourseAnnouncementsTab({ course, state, helpers }) {
  const announcements = helpers.getAnnouncements(course);
  const canManage = helpers.canManageCourse(course);
  const user = helpers.getCurrentUser();
  const readOnlyMessage = user.role === "teacher" ? "This course is outside your teacher permissions, so announcements are read-only." : "Announcements are read-only for students.";
  return h(
    "div",
    { className: "announcement-space course-tab-panel" },
    canManage ? h(AnnouncementEditor, { course, state, helpers }) : h("div", { className: "paper-panel role-note" }, h("strong", null, "Read-only view"), h("p", null, readOnlyMessage)),
    h(
      "div",
      { className: "paper-panel" },
      h("div", { className: "panel-head" }, h("h2", null, "Announcements"), h("span", null, course.name)),
      announcements.length
        ? announcements.map((event) => h(AnnouncementCard, { key: event.id, announcement: { ...event, courseName: course.name, courseColor: course.color }, canManage, helpers, course }))
        : h("p", { className: "empty" }, "No announcements yet.")
    )
  );
}

function AnnouncementEditor({ course, state, helpers }) {
  const editing = Boolean(state.editingAnnouncement);
  return h(
    "form",
    {
      className: "announcement-editor paper-panel",
      onSubmit: (event) => {
        event.preventDefault();
        helpers.saveAnnouncement(course.id);
      },
    },
    h("div", { className: "panel-head" }, h("h2", null, editing ? "Edit announcement" : "Create announcement"), h("span", null, "Teacher tools")),
    h("label", null, "Title"),
    h("input", {
      value: state.announcementForm.title,
      placeholder: "Lab room change, review session, new reading...",
      onChange: (event) => helpers.setAnnouncementForm("title", event.target.value),
    }),
    h("label", null, "Message"),
    h("textarea", {
      value: state.announcementForm.detail,
      placeholder: "Write the note students should see in this course.",
      onChange: (event) => helpers.setAnnouncementForm("detail", event.target.value),
    }),
    h(
      "div",
      { className: "editor-actions" },
      h("button", { className: "primary", disabled: !state.announcementForm.title.trim() || !state.announcementForm.detail.trim() }, editing ? "Save announcement" : "Post announcement"),
      editing ? h("button", { type: "button", onClick: helpers.cancelAnnouncementEdit }, "Cancel") : null
    )
  );
}

function AnnouncementCard({ announcement, canManage, helpers, course }) {
  return h(
    "article",
    { className: "activity-item announcement-card", style: { "--accent": announcement.courseColor || course.color } },
    h("span", null, `${announcement.type} - ${formatDate(announcement.date)}`),
    h("strong", null, announcement.title),
    h("p", null, `${announcement.courseName}: ${announcement.detail}`),
    canManage
      ? h(
          "div",
          { className: "announcement-actions" },
          h("button", { onClick: () => helpers.startAnnouncementEdit(announcement) }, "Edit"),
          h("button", { onClick: () => helpers.deleteAnnouncement(course.id, announcement.id) }, "Delete")
        )
      : null
  );
}

function CourseDiscussionsTab({ course, state, helpers }) {
  const selected = course.discussions.find((topic) => topic.id === state.selectedDiscussion);
  if (selected) return h(DiscussionDetail, { course, discussion: selected, state, helpers });

  return h(
    "div",
    { className: "discussion-board course-tab-panel" },
    course.discussions.map((topic) => {
      const extraReplies = state.discussionReplies[topic.id] || [];
      const replyCount = countReplies(topic.replies) + extraReplies.length;
      const unread = state.readDiscussions[topic.id] ? 0 : topic.unread;
      return h(
        "article",
        { key: topic.id, className: `discussion-card ${unread ? "unread" : ""}` },
        h("span", null, course.name),
        h("h2", null, topic.title),
        h("p", null, topic.prompt),
        h("div", { className: "discussion-meta" }, h("strong", null, `${replyCount} replies`), h("em", null, unread ? `${unread} unread` : "All read")),
        h("button", { onClick: () => helpers.openDiscussion(topic.id) }, "Open discussion")
      );
    })
  );
}

function DiscussionDetail({ course, discussion, state, helpers }) {
  const extraReplies = state.discussionReplies[discussion.id] || [];
  const replies = [...discussion.replies, ...extraReplies];
  const draft = state.discussionDrafts[discussion.id] || "";
  return h(
    "div",
    { className: "discussion-detail course-tab-panel" },
    h(
      "section",
      { className: "discussion-prompt paper-panel" },
      h("button", { className: "ghost-button", onClick: helpers.closeDiscussion }, "Back to discussions"),
      h("span", { className: "eyebrow" }, course.name),
      h("h2", null, discussion.title),
      h("p", null, discussion.prompt),
      h("div", { className: "discussion-meta" }, h("strong", null, `${countReplies(replies)} replies`), h("em", null, "Marked read"))
    ),
    h(
      "section",
      { className: "reply-thread" },
      replies.map((reply) => h(ReplyCard, { key: reply.id, reply }))
    ),
    h(
      "form",
      {
        className: "reply-composer paper-panel",
        onSubmit: (event) => {
          event.preventDefault();
          helpers.addDiscussionReply(discussion.id);
        },
      },
      h("label", null, "Add your reply"),
      h("textarea", {
        value: draft,
        placeholder: "Share a question, source, or study note with the class...",
        onChange: (event) => helpers.setDiscussionDraft(discussion.id, event.target.value),
      }),
      h("button", { className: "primary", disabled: !draft.trim() }, "Post reply")
    )
  );
}

function ReplyCard({ reply }) {
  return h(
    "article",
    { className: "reply-card" },
    h("div", { className: "reply-pin" }),
    h("div", { className: "reply-head" }, h("span", { className: "avatar" }, initialsFor(reply.author)), h("div", null, h("strong", null, reply.author), h("small", null, `${reply.role} - ${formatDate(reply.date)}`))),
    h("p", null, reply.body),
    reply.children?.length ? h("div", { className: "reply-children" }, reply.children.map((child) => h(ReplyCard, { key: child.id, reply: child }))) : null
  );
}

function CourseAssignmentsTab({ course, assignments, state, helpers }) {
  const canManage = helpers.canManageCourse(course);
  return h(
    "div",
    { className: "teacher-assignment-space course-tab-panel" },
    canManage ? h(AssignmentEditor, { course, state, helpers }) : h("div", { className: "paper-panel role-note" }, h("strong", null, "Student view"), h("p", null, "Assignments are read-only except for your completion status.")),
    h("div", { className: "assignment-board" }, assignments.map((assignment) => h(AssignmentCard, { key: assignment.id, assignment, helpers, canManage, course })))
  );
}

function AssignmentEditor({ course, state, helpers }) {
  const editing = Boolean(state.editingAssignment);
  return h(
    "form",
    {
      className: "assignment-editor paper-panel",
      onSubmit: (event) => {
        event.preventDefault();
        helpers.saveAssignment(course.id);
      },
    },
    h("div", { className: "panel-head" }, h("h2", null, editing ? "Edit assignment" : "Create assignment"), h("span", null, "Teacher clipboard")),
    h("label", null, "Title"),
    h("input", { value: state.assignmentForm.title, placeholder: "Lab report, quiz, reading notes...", onChange: (event) => helpers.setAssignmentForm("title", event.target.value) }),
    h("label", null, "Description"),
    h("textarea", { value: state.assignmentForm.description, placeholder: "Instructions students should see.", onChange: (event) => helpers.setAssignmentForm("description", event.target.value) }),
    h(
      "div",
      { className: "form-grid" },
      h("label", null, "Due date", h("input", { type: "date", value: state.assignmentForm.due, onChange: (event) => helpers.setAssignmentForm("due", event.target.value) })),
      h("label", null, "Points", h("input", { type: "number", min: "0", value: state.assignmentForm.points, onChange: (event) => helpers.setAssignmentForm("points", event.target.value) })),
      h("label", null, "Group", h("input", { value: state.assignmentForm.group, onChange: (event) => helpers.setAssignmentForm("group", event.target.value) })),
      h("label", null, "Module", h("input", { value: state.assignmentForm.module, onChange: (event) => helpers.setAssignmentForm("module", event.target.value) })),
      h("label", null, "Type", h("select", { value: state.assignmentForm.type, onChange: (event) => helpers.setAssignmentForm("type", event.target.value) }, ["Assignment", "Quiz", "Discussion", "Reading", "Page"].map((type) => h("option", { key: type, value: type }, type)))),
      h("label", { className: "check-row" }, h("input", { type: "checkbox", checked: state.assignmentForm.published, onChange: (event) => helpers.setAssignmentForm("published", event.target.checked) }), "Published")
    ),
    h(
      "div",
      { className: "editor-actions" },
      h("button", { className: "primary", disabled: !state.assignmentForm.title.trim() }, editing ? "Save assignment" : "Create assignment"),
      editing ? h("button", { type: "button", onClick: helpers.cancelAssignmentEdit }, "Cancel") : null
    )
  );
}

function CoursePeopleTab({ course, helpers }) {
  const canManage = helpers.canManageCourse(course);
  const roster = canManage ? sampleRoster(course) : course.people;
  return h(
    "div",
    { className: "people-board course-tab-panel" },
    canManage ? h("article", { className: "person-card roster-summary" }, h("span", { className: "avatar" }, "GB"), h("div", null, h("h2", null, "Gradebook roster"), h("p", null, "Teacher view includes fake student grade, progress, and missing-work snapshots."), h("small", null, "Message buttons can connect to Inbox in a later pass."))) : null,
    roster.map((person) => h("article", { key: person.email, className: "person-card" }, h("span", { className: "avatar" }, initialsFor(person.name)), h("div", null, h("h2", null, person.name), h("p", null, person.role || `${person.grade}% current grade - ${person.missing} missing`), h("small", null, person.email || `${person.progress}% module progress`))))
  );
}

function SettingsView({ state, helpers }) {
  const user = helpers.getCurrentUser();
  const bio = helpers.getCourse("bio");
  const canManageBio = helpers.canManageCourse(bio);
  return h(
    "section",
    { className: "settings-panel" },
    h("div", null, h("span", { className: "eyebrow" }, "Appearance"), h("h2", null, "Study desk lighting"), h("p", null, "Switch between a clean daytime desktop and a quieter nighttime desk setup.")),
    h(
      "button",
      { className: "theme-switch", onClick: helpers.toggleTheme },
      h("span", { className: state.theme === "light" ? "active" : "" }, "Light"),
      h("span", { className: state.theme === "dark" ? "active" : "" }, "Dark")
    ),
    h("div", { className: "settings-card" }, h("h3", null, "Prototype behavior"), h("p", null, "Completion toggles, target grades, teacher announcements, and teacher assignments are saved in local browser storage.")),
    canManageBio
      ? h(
          "div",
          { className: "settings-card teacher-ledger" },
          h("h3", null, "BIO 221 Course Settings"),
          h("p", null, "Dr. Rivera can manage BIO 221 content. Editable course name, room, syllabus, grading weights, late policy, and publish status are represented here as the next settings workflow."),
          h("div", { className: "ledger-grid" }, h("span", null, "Visibility"), h("strong", null, "Published"), h("span", null, "Late policy"), h("strong", null, "Flag late after due date"), h("span", null, "Managed by"), h("strong", null, user.name))
        )
      : null
  );
}

function CourseFolder({ course, state, helpers }) {
  return h(
    "button",
    {
      className: `folder subject-${course.id} ${state.selectedCourse === course.id ? "selected" : ""}`,
      style: { "--accent": course.color },
      onClick: () => helpers.openCourse(course.id),
    },
    h("span", { className: "folder-art", "aria-hidden": "true" }),
    h("span", null, course.name),
    h("strong", null, `${Math.round(course.grade)}%`),
    h("i", { style: { height: `${completionRatio(course, helpers)}%` } })
  );
}

function CourseBinder({ course, helpers }) {
  return h(
    "article",
    { className: `binder subject-${course.id}`, style: { "--accent": course.color } },
    h("div", { className: "binder-spine" }),
    h("span", { className: "binder-art", "aria-hidden": "true" }),
    h(
      "div",
      { className: "binder-content" },
      h("span", null, course.name),
      h("h2", null, course.title),
      h("p", null, `${course.instructor} - ${course.room}`),
      h("div", { className: `stamp ${riskLabel(course, null, helpers).toLowerCase().replace(" ", "-")}` }, riskLabel(course, null, helpers)),
      h("button", { onClick: () => helpers.openCourse(course.id) }, "Open course desk")
    )
  );
}

function AssignmentSlip({ assignment, helpers }) {
  return h(
    "div",
    { className: `slip ${assignment.realStatus}` },
    h("div", null, h("strong", null, assignment.title), h("span", null, `${assignment.courseName} - ${formatDate(assignment.due)} - ${dueLabel(assignment.due)}`)),
    h("button", { onClick: () => helpers.toggleComplete(assignment.id) }, assignment.realStatus === "complete" ? "Done" : "Mark done")
  );
}

function AssignmentCard({ assignment, helpers, canManage = false, course = null }) {
  return h(
    "article",
    { className: `assignment-card ${assignment.realStatus} ${assignment.published ? "" : "unpublished"}`, style: { "--accent": assignment.courseColor } },
    h("div", { className: "card-pin" }),
    h("div", { className: "assignment-top" }, h("span", null, assignment.courseName), h("strong", null, assignment.published ? dueLabel(assignment.due) : "Unpublished")),
    h("h2", null, assignment.title),
    h("p", null, `${assignment.group} - ${assignment.points} pts - ${assignment.type}${assignment.description ? ` - ${assignment.description}` : ""}`),
    h("div", { className: "completion-mark" }, h("span", null, assignment.realStatus === "complete" ? "Stamped complete" : assignment.realStatus === "missing" ? "Missing" : "In progress")),
    h("button", { onClick: () => helpers.toggleComplete(assignment.id) }, assignment.realStatus === "complete" ? "Undo complete" : "Mark completed"),
    canManage
      ? h(
          "div",
          { className: "announcement-actions" },
          h("button", { onClick: () => helpers.startAssignmentEdit(assignment) }, "Edit"),
          h("button", { onClick: () => helpers.deleteAssignment(course.id, assignment.id) }, "Delete")
        )
      : null
  );
}

function ModuleCard({ module }) {
  const percent = Math.round((module.complete / module.total) * 100);
  return h(
    "article",
    { className: "module-card" },
    h("div", { className: "module-top" }, h("strong", null, module.title), h("span", null, `${module.complete}/${module.total}`)),
    h("div", { className: "rail" }, h("i", { style: { width: `${percent}%` } })),
    h("ul", null, module.items.map((item) => h("li", { key: item }, item)))
  );
}

function GradeRow({ assignment }) {
  return h(
    "article",
    { className: `grade-row ${assignment.realStatus}`, style: { "--accent": assignment.courseColor } },
    h("div", null, h("strong", null, assignment.title), h("span", null, `${assignment.courseName} - ${assignment.module}`)),
    h("span", null, formatDate(assignment.due)),
    h("span", { className: "status-chip" }, assignment.realStatus),
    h("strong", null, assignment.score === null ? `-- / ${assignment.points}` : `${assignment.score} / ${assignment.points}`),
    h("div", { className: "grade-icons" }, assignment.comments ? h("span", null, "Feedback") : null, assignment.rubric ? h("span", null, "Rubric") : null)
  );
}

function CalendarGroup({ title, assignments, helpers }) {
  return h(
    "div",
    { className: "calendar-group" },
    h("div", { className: "panel-head" }, h("h2", null, title), h("span", null, `${assignments.length} items`)),
    assignments.length
      ? assignments.map((assignment) =>
          h(
            "div",
            { key: assignment.id, className: "calendar-row" },
            h("div", { className: "date-block", style: { "--accent": assignment.courseColor } }, h("strong", null, formatDate(assignment.due)), h("span", null, dueLabel(assignment.due))),
            h(AssignmentCard, { assignment, helpers })
          )
        )
      : h("p", { className: "empty" }, "No calendar items.")
  );
}

function ActivityItem({ event }) {
  return h(
    "article",
    { className: "activity-item", style: { "--accent": event.courseColor || "#5c7f81" } },
    h("span", null, `${event.type} - ${formatDate(event.date)}`),
    h("strong", null, event.title),
    h("p", null, `${event.courseName ? `${event.courseName}: ` : ""}${event.detail}`)
  );
}

function ResourceRow({ resource, course }) {
  return h(
    "article",
    { className: "resource-row", style: { "--accent": course.color } },
    h("span", { className: "file-badge" }, resource.type),
    h("div", null, h("strong", null, resource.title), h("span", null, `${course.name} - updated ${formatDate(resource.updated)}`))
  );
}

function MessageCard({ message }) {
  return h(
    "article",
    { className: `message-card ${message.unread ? "unread" : ""}`, style: { "--accent": message.course.color } },
    h("div", { className: "message-head" }, h("span", null, message.course.name), h("small", null, formatDate(message.date))),
    h("h2", null, message.subject),
    h("p", null, message.body),
    h("strong", null, message.from)
  );
}

function GradeGauge({ grade, color, large = false }) {
  const waterLevel = `${Math.max(0, Math.min(100, grade))}%`;
  return h(
    "div",
    {
      className: `gauge ${large ? "large" : ""}`,
      style: { "--grade": grade, "--accent": color, "--water": waterLevel },
      "aria-label": `Current grade ${grade.toFixed(1)} percent`,
    },
    h("div", { className: "gauge-track" },
      h("div", { className: "gauge-liquid" },
        h("div", { className: "gauge-wave back" }),
        h("div", { className: "gauge-wave front" })
      ),
      h("div", { className: "gauge-glass" }),
      h("div", { className: "gauge-score" }, `${large ? grade.toFixed(1) : Math.round(grade)}%`),
      h("div", { className: "gauge-marker" })
    ),
    h("div", { className: "gauge-scale" },
      h("span", null, "0"),
      h("span", null, "50"),
      h("span", null, "100")
    )
  );
}

function headline(section) {
  return {
    Dashboard: "Your academic desk is ready.",
    Profile: "Student profile",
    Courses: "Course binders",
    Course: "Course desk",
    "To-Do": "To-do tray",
    Grades: "Grade progress",
    Assignments: "Assignment tray",
    Calendar: "Upcoming work",
    Inbox: "Course messages",
    Settings: "Desk settings",
  }[section];
}

function formatDate(dateString) {
  if (!dateString) return "Undated";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${dateString}T12:00:00`));
}

function daysUntil(dateString) {
  if (!dateString) return 999;
  const due = new Date(`${dateString}T12:00:00`);
  return Math.round((due - today) / 86400000);
}

function dueLabel(dateString) {
  if (!dateString) return "No due date";
  const days = daysUntil(dateString);
  if (days < 0) return `${Math.abs(days)}d late`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days}d left`;
}

function sortByDue(a, b) {
  return (a.due || "9999-12-31").localeCompare(b.due || "9999-12-31");
}

function sortByUrgency(a, b) {
  const statusWeight = { missing: 0, upcoming: 1, undated: 3, complete: 4 };
  return (statusWeight[a.realStatus] ?? 2) - (statusWeight[b.realStatus] ?? 2) || daysUntil(a.due) - daysUntil(b.due) || a.title.localeCompare(b.title);
}

function enrichCourseAssignments(course, helpers) {
  return helpers.getCourseAssignments(course);
}

function sampleRoster(course) {
  if (course.id !== "bio") return course.people;
  return [
    { name: "Avery Reed", role: "Student", email: "avery.reed@northlake.edu", grade: 87, missing: 1, progress: 68 },
    { name: "Jordan Ellis", role: "Student", email: "jellis@northlake.edu", grade: 91, missing: 0, progress: 76 },
    { name: "Camila Ortiz", role: "Student", email: "cortiz@northlake.edu", grade: 82, missing: 2, progress: 59 },
    { name: "Maya Chen", role: "Teaching Assistant", email: "mchen-ta@northlake.edu", grade: 100, missing: 0, progress: 100 },
  ];
}

function sortGradeRows(assignments, sort) {
  const rows = [...assignments];
  if (sort === "name") return rows.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "module") return rows.sort((a, b) => a.module.localeCompare(b.module) || a.title.localeCompare(b.title));
  if (sort === "group") return rows.sort((a, b) => a.group.localeCompare(b.group) || a.title.localeCompare(b.title));
  return rows.sort(sortByDue);
}

function initialsFor(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function countReplies(replies) {
  return replies.reduce((sum, reply) => sum + 1 + countReplies(reply.children || []), 0);
}

function completionRatio(course, helpers) {
  const assignments = helpers.getCourseAssignments(course);
  const complete = assignments.filter((assignment) => helpers.assignmentStatus(assignment) === "complete").length;
  return Math.round((complete / Math.max(assignments.length, 1)) * 100);
}

function riskLabel(course, state, helpers) {
  const missing = helpers.getCourseAssignments(course).filter((assignment) => helpers.assignmentStatus(assignment) === "missing").length;
  const target = state?.targets?.[course.id] || course.target;
  if (course.grade < 80 || missing > 0) return "Needs attention";
  if (course.grade < target) return "Close watch";
  return "On track";
}

function neededScore(course, state) {
  const completedWeight = course.weights.filter((group) => !group.remaining).reduce((sum, group) => sum + group.weight, 0);
  const currentWeighted = course.weights.filter((group) => !group.remaining).reduce((sum, group) => sum + group.earned * (group.weight / 100), 0);
  const remainingWeight = Math.max(100 - completedWeight, 1);
  const target = Number(state.targets[course.id] || course.target);
  return Math.max(0, Math.min(125, ((target - currentWeighted) / remainingWeight) * 100));
}

function nextFocus(assignments) {
  return assignments
    .filter((assignment) => assignment.realStatus !== "complete")
    .sort(sortByUrgency)[0];
}

const h = React.createElement;
