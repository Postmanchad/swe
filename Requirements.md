# Requirements Document: Simplroutine

## 1. Customer Statement of Requirements
Simplroutine is a scheduling and productivity app designed for everyday people and students. The main purpose is to help users organize their schedules, manage responsibilities, set goals, and stay productive in one convenient location without needing to switch between multiple applications.


-- 2. Requirements Specification

---- Functional Requirements
 **Calendar System & Custom Events:** Users can view schedules across monthly, weekly, daily, and yearly views with hourly time-blocking for detailed planning.
 
 **Recurring Tasks:** Users can set recurring tasks and events for specific days of the week (e.g., classes running every Monday and Wednesday).
 **Inline Notes:** Clicking on any scheduled task opens an inline notes section to add specific details, reminders, or agendas.
 
 **Academic Tracker:** A dedicated homework section allows students to manage courses and individual assignments with due dates, submission times, urgency priority indicators, and course tags.
 **Goal Setting & Task Management:** Users can create short-term and long-term goals broken down with progress bars, monthly intentions, and task filtering/sorting options by priority, category, or status.
 

---- Non-Functional Requirements
 **Responsive Architecture:** Built using React.js and Tailwind CSS to dynamically adapt between multi-column desktop planning dashboards and streamlined mobile views.
 **Containerization:** Packaged using Docker and Docker Compose to ensure consistent runtime environments across development and deployment.
 

-- 3. Data and Storage Blueprint
 **Data Input:** Manual user entry via interactive UI forms for events, tasks, notes, and homework assignments, alongside automated system inputs for recurring schedule logic and authentication.
 
 **Database or Storage:** Relational database (PostgreSQL) storing structured user accounts, courses, schedule patterns, task lists, and linked notes.
