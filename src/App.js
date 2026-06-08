import React, { useEffect, useMemo, useState } from "react";
import { courses, messages, navItems } from "./data.js?v=canvas-pass-10";

const storageKey = "deskcanvas-react-state-v1";
const today = new Date("2026-06-02T12:00:00");
const testProfile = {
  name: "Avery Reed",
  initials: "AR",
  email: "avery.reed@northlake.edu",
  pronouns: "she/her",
  language: "English",
  timeZone: "America/New_York",
  term: "Spring term",
};

function createInitialState() {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  return {
    loggedIn: saved.loggedIn ?? true,
    section: saved.section || "Dashboard",
    selectedCourse: saved.selectedCourse || "bio",
    theme: saved.theme || "light",
    profileMenuOpen: false,
    gradeSort: saved.gradeSort || "due",
    inboxFilter: saved.inboxFilter || "all",
    targets: saved.targets || Object.fromEntries(courses.map((course) => [course.id, course.target])),
    completed: saved.completed || {},
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
  const assignmentStatus = (assignment) => (state.completed[assignment.id] ? "complete" : assignment.status);
  const getCourse = (id = state.selectedCourse) => courses.find((course) => course.id === id) || courses[0];
  const getAssignments = () =>
    courses.flatMap((course) =>
      course.assignments.map((assignment) => ({
        ...assignment,
        courseId: course.id,
        courseName: course.name,
        courseTitle: course.title,
        courseColor: course.color,
        instructor: course.instructor,
        realStatus: assignmentStatus(assignment),
      }))
    );

  return {
    getCourse,
    getAssignments,
    assignmentStatus,
    setSection: (section) => update({ section }),
    setCourse: (selectedCourse) => update({ selectedCourse }),
    openCourse: (selectedCourse) => update({ selectedCourse, section: "Course" }),
    openGrades: (selectedCourse) => update({ selectedCourse, section: "Grades" }),
    setGradeSort: (gradeSort) => update({ gradeSort }),
    setInboxFilter: (inboxFilter) => update({ inboxFilter }),
    toggleProfileMenu: () => update({ profileMenuOpen: !state.profileMenuOpen }),
    viewProfile: () => update({ section: "Profile", profileMenuOpen: false }),
    login: () => update({ loggedIn: true, section: "Dashboard", profileMenuOpen: false }),
    logout: () => update({ loggedIn: false, section: "Dashboard", profileMenuOpen: false }),
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
  return h(
    "main",
    { className: "login-page" },
    h(
      "section",
      { className: "login-card" },
      h("div", { className: "brand-mark login-mark" }, "DC"),
      h("span", { className: "eyebrow" }, "Student login"),
      h("h1", null, "Welcome back to DeskCanvas."),
      h("p", null, "Use the test profile to enter the prototype student dashboard."),
      h(
        "div",
        { className: "login-profile" },
        h("span", { className: "avatar" }, testProfile.initials),
        h("div", null, h("strong", null, testProfile.name), h("small", null, testProfile.email))
      ),
      h("button", { className: "primary login-button", onClick: helpers.login }, "Log in as Avery")
    )
  );
}

function Topbar({ state, helpers }) {
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
        h("span", { className: "avatar" }, testProfile.initials),
        h("div", null, h("strong", null, testProfile.name), h("small", null, testProfile.term))
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
  if (state.section === "Profile") return h(ProfileView);
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

function ProfileView() {
  const details = [
    ["Name", testProfile.name],
    ["Email", testProfile.email],
    ["Pronouns", testProfile.pronouns],
    ["Language", testProfile.language],
    ["Time zone", testProfile.timeZone],
  ];

  return h(
    "section",
    { className: "profile-page" },
    h(
      "div",
      { className: "profile-card" },
      h("span", { className: "avatar profile-avatar" }, testProfile.initials),
      h("div", null, h("span", { className: "eyebrow" }, "Test profile"), h("h2", null, testProfile.name), h("p", null, "This fake profile powers the prototype login and account menu."))
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
  const missing = assignments.filter((assignment) => assignment.realStatus === "missing");
  const upcoming = assignments
    .filter((assignment) => assignment.realStatus !== "complete")
    .sort(sortByUrgency)
    .slice(0, 5);
  const activity = courses.flatMap((item) => item.activity.map((event) => ({ ...event, courseName: item.name, courseColor: item.color }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  return h(
    "section",
    { className: "dashboard-grid" },
    h(
      "div",
      { className: "hero-pad" },
      h("div", { className: "pad-lines" }),
      h(
        "div",
        { className: "hero-copy" },
        h("span", { className: "eyebrow" }, "React MVP"),
        h("h2", null, "A Canvas-style student home base with grades, work, risk, and targets in one place."),
        h("p", null, "Screen layout: left navigation, dashboard overview, course binders, liquid grade meters, assignment tray, upcoming calendar, and settings with theme control.")
      )
    ),
    h(
      "div",
      { className: "meter-card" },
      h(GradeGauge, { grade: course.grade, color: course.color }),
      h("h3", null, `${course.name} grade`),
      h("p", null, `${riskLabel(course, state, helpers)} toward ${state.targets[course.id]}%`)
    ),
    h("div", { className: "course-rack" }, courses.map((item) => h(CourseFolder, { key: item.id, course: item, state, helpers }))),
    h(
      "div",
      { className: "paper-panel" },
      h("div", { className: "panel-head" }, h("h2", null, "Due Soon"), h("span", null, `${upcoming.length} active`)),
      upcoming.map((assignment) => h(AssignmentSlip, { key: assignment.id, assignment, helpers }))
    ),
    h(
      "div",
      { className: "paper-panel warning" },
      h("div", { className: "panel-head" }, h("h2", null, "Missing Work"), h("span", null, `${missing.length} items`)),
      missing.length ? missing.map((assignment) => h(AssignmentSlip, { key: assignment.id, assignment, helpers })) : h("p", { className: "empty" }, "No missing work. The desk is calm.")
    ),
    h(
      "div",
      { className: "paper-panel activity-panel" },
      h("div", { className: "panel-head" }, h("h2", null, "Recent Activity"), h("span", null, "All courses")),
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
      { className: "detail-grid" },
      h("div", { className: "paper-panel" }, h("div", { className: "panel-head" }, h("h2", null, "Modules"), h("span", null, `${course.modules.length} groups`)), course.modules.map((module) => h(ModuleCard, { key: module.id, module }))),
      h("div", { className: "paper-panel" }, h("div", { className: "panel-head" }, h("h2", null, "Active Work"), h("span", null, `${active.length} items`)), active.map((assignment) => h(AssignmentSlip, { key: assignment.id, assignment, helpers }))),
      h("div", { className: "paper-panel" }, h("div", { className: "panel-head" }, h("h2", null, "Recent Activity"), h("span", null, course.name)), course.activity.map((event) => h(ActivityItem, { key: event.id, event: { ...event, courseName: course.name, courseColor: course.color } }))),
      h("div", { className: "paper-panel" }, h("div", { className: "panel-head" }, h("h2", null, "Files & Resources"), h("span", null, `${course.resources.length} files`)), course.resources.map((resource) => h(ResourceRow, { key: resource.id, resource, course }))),
      h("div", { className: "paper-panel wide-panel" }, h("div", { className: "panel-head" }, h("h2", null, "Grade Details"), h("button", { onClick: () => helpers.openGrades(course.id) }, "Open full gradebook")), assignments.map((assignment) => h(GradeRow, { key: assignment.id, assignment })))
    )
  );
}

function SettingsView({ state, helpers }) {
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
    h("div", { className: "settings-card" }, h("h3", null, "Prototype behavior"), h("p", null, "Completion toggles and target grades are saved in local browser storage."))
  );
}

function CourseFolder({ course, state, helpers }) {
  return h(
    "button",
    {
      className: `folder ${state.selectedCourse === course.id ? "selected" : ""}`,
      style: { "--accent": course.color },
      onClick: () => helpers.openCourse(course.id),
    },
    h("span", null, course.name),
    h("strong", null, `${Math.round(course.grade)}%`),
    h("i", { style: { height: `${completionRatio(course, helpers)}%` } })
  );
}

function CourseBinder({ course, helpers }) {
  return h(
    "article",
    { className: "binder", style: { "--accent": course.color } },
    h("div", { className: "binder-spine" }),
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

function AssignmentCard({ assignment, helpers }) {
  return h(
    "article",
    { className: `assignment-card ${assignment.realStatus}`, style: { "--accent": assignment.courseColor } },
    h("div", { className: "card-pin" }),
    h("div", { className: "assignment-top" }, h("span", null, assignment.courseName), h("strong", null, dueLabel(assignment.due))),
    h("h2", null, assignment.title),
    h("p", null, `${assignment.group} - ${assignment.points} pts - grade impact ${assignment.impact}%`),
    h("div", { className: "completion-mark" }, h("span", null, assignment.realStatus === "complete" ? "Stamped complete" : assignment.realStatus === "missing" ? "Missing" : "In progress")),
    h("button", { onClick: () => helpers.toggleComplete(assignment.id) }, assignment.realStatus === "complete" ? "Undo complete" : "Mark completed")
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
  return course.assignments.map((assignment) => ({
    ...assignment,
    courseId: course.id,
    courseName: course.name,
    courseColor: course.color,
    realStatus: helpers.assignmentStatus(assignment),
  }));
}

function sortGradeRows(assignments, sort) {
  const rows = [...assignments];
  if (sort === "name") return rows.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "module") return rows.sort((a, b) => a.module.localeCompare(b.module) || a.title.localeCompare(b.title));
  if (sort === "group") return rows.sort((a, b) => a.group.localeCompare(b.group) || a.title.localeCompare(b.title));
  return rows.sort(sortByDue);
}

function completionRatio(course, helpers) {
  const complete = course.assignments.filter((assignment) => helpers.assignmentStatus(assignment) === "complete").length;
  return Math.round((complete / course.assignments.length) * 100);
}

function riskLabel(course, state, helpers) {
  const missing = course.assignments.filter((assignment) => helpers.assignmentStatus(assignment) === "missing").length;
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
