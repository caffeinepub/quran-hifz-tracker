# Quran Hifz Tracker

## Current State
- TeacherDashboard shows students as cards in a grid (no sorting)
- AdminDashboard StudentsTab shows students in a table with columns: Student Name, Class/Section, Teacher, Actions (no sorting)
- AdminDashboard TeacherAccountsTab shows teachers in a table with columns: Name, Email, Status, Actions (no sorting)

## Requested Changes (Diff)

### Add
- Sortable column headers on the Admin Students table: Student Name, Class/Section, Teacher — clicking a header sorts ascending, clicking again sorts descending, clicking a third time resets
- Sort controls on the Teacher Dashboard student list: sort by Name (A-Z / Z-A) and Class — displayed as clickable header labels above the card grid or as a sort bar
- Visual indicator (arrow icon) on currently sorted column/control showing sort direction
- Sort state is local (no backend changes needed)

### Modify
- TeacherDashboard: add a sort bar above the student grid with Name and Class sort buttons
- AdminDashboard StudentsTab: make Student Name, Class/Section, and Teacher column headers clickable with sort arrows

### Remove
- Nothing removed

## Implementation Plan
1. TeacherDashboard: Add `sortField` and `sortDir` state. Add a sort bar with "Name" and "Class" buttons showing ChevronUp/ChevronDown/ChevronsUpDown icons. Apply sort to the `students` array before rendering.
2. AdminDashboard StudentsTab: Add `sortField` (name | class | teacher) and `sortDir` (asc | desc | none) state. Wrap each `<TableHead>` for those three columns with a click handler and render sort icon. Apply sort to the `students` array before rendering.
3. No backend changes required.
