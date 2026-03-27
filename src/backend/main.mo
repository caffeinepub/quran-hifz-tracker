import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Text "mo:core/Text";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let ADMIN_EMAIL = "murtazatinwala@msbinstitute.com";

  type StoredProfile = { name : Text; role : Text };
  public type UserProfile = { name : Text; role : Text; email : Text };

  let userProfiles = Map.empty<Principal, StoredProfile>();
  let userEmails = Map.empty<Principal, Text>();

  func isAdminCaller(caller : Principal) : Bool {
    switch (accessControlState.userRoles.get(caller)) { case (?#admin) { return true }; case _ {} };
    switch (userEmails.get(caller)) {
      case (?email) { email == ADMIN_EMAIL };
      case null { false };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    switch (userProfiles.get(caller)) {
      case (?p) {
        let email = switch (userEmails.get(caller)) { case (?e) e; case null "" };
        ?{ name = p.name; role = p.role; email };
      };
      case null { null };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not isAdminCaller(caller)) { Runtime.trap("Unauthorized") };
    switch (userProfiles.get(user)) {
      case (?p) {
        let email = switch (userEmails.get(user)) { case (?e) e; case null "" };
        ?{ name = p.name; role = p.role; email };
      };
      case null { null };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    userProfiles.add(caller, { name = profile.name; role = profile.role });
    userEmails.add(caller, profile.email);
    switch (accessControlState.userRoles.get(caller)) {
      case (null) {
        if (profile.email == ADMIN_EMAIL) {
          accessControlState.userRoles.add(caller, #admin);
        } else {
          let acRole : AccessControl.UserRole = if (profile.role == "guest") { #guest } else { #user };
          accessControlState.userRoles.add(caller, acRole);
        };
      };
      case (?existingRole) {
        if (existingRole != #admin and profile.email == ADMIN_EMAIL) {
          accessControlState.userRoles.add(caller, #admin);
        };
      };
    };
  };

  public type TeacherCredential = { email : Text; password : Text; name : Text; claimedBy : ?Principal };
  let teacherCredentials = Map.empty<Text, TeacherCredential>();

  public shared ({ caller }) func createTeacherCredential(email : Text, password : Text, name : Text) : async () {
    if (not isAdminCaller(caller)) { Runtime.trap("Unauthorized: Only admin can create teacher accounts") };
    teacherCredentials.add(email, { email; password; name; claimedBy = null });
  };

  public shared ({ caller }) func claimTeacherAccount(email : Text, password : Text) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Must be logged in") };
    switch (teacherCredentials.get(email)) {
      case (?cred) {
        if (cred.password != password) { Runtime.trap("Invalid email or password") };
        switch (cred.claimedBy) {
          case (?existing) { if (existing != caller) { Runtime.trap("This account is already in use") } };
          case (null) {};
        };
        teacherCredentials.add(email, { email = cred.email; password = cred.password; name = cred.name; claimedBy = ?caller });
        // Grant admin role if this is the admin email, otherwise teacher role
        if (email == ADMIN_EMAIL) {
          accessControlState.userRoles.add(caller, #admin);
          userProfiles.add(caller, { name = cred.name; role = "admin" });
        } else {
          accessControlState.userRoles.add(caller, #user);
          userProfiles.add(caller, { name = cred.name; role = "user" });
        };
        userEmails.add(caller, email);
      };
      case (null) { Runtime.trap("No account found for this email") };
    };
  };

  public query ({ caller }) func listTeacherCredentials() : async [TeacherCredential] {
    if (not isAdminCaller(caller)) { Runtime.trap("Unauthorized: Only admin can view teacher accounts") };
    teacherCredentials.values().toArray();
  };

  public shared ({ caller }) func deleteTeacherCredential(email : Text) : async () {
    if (not isAdminCaller(caller)) { Runtime.trap("Unauthorized") };
    teacherCredentials.remove(email);
  };

  public shared ({ caller }) func resetTeacherPassword(email : Text, newPassword : Text) : async () {
    if (not isAdminCaller(caller)) { Runtime.trap("Unauthorized") };
    switch (teacherCredentials.get(email)) {
      case (?cred) { teacherCredentials.add(email, { email = cred.email; password = newPassword; name = cred.name; claimedBy = cred.claimedBy }) };
      case (null) { Runtime.trap("Account not found") };
    };
  };

  type StudentLegacy = { id : Nat; name : Text; teacherId : Principal; parentUserId : ?Principal; createdAt : Time.Time };

  type Student = {
    id : Nat; name : Text; studentClass : Text; section : Text; parentWhatsapp : Text;
    teacherId : Principal; parentUserId : ?Principal; createdAt : Time.Time;
  };

  module Student {
    public func compare(s1 : Student, s2 : Student) : Order.Order { Text.compare(s1.name, s2.name) };
  };

  let students = Map.empty<Nat, StudentLegacy>();
  let studentsV2 = Map.empty<Nat, Student>();
  var studentsMigrated = false;

  system func postupgrade() {
    if (not studentsMigrated) {
      for ((k, v) in students.entries()) {
        studentsV2.add(k, { id = v.id; name = v.name; studentClass = ""; section = ""; parentWhatsapp = ""; teacherId = v.teacherId; parentUserId = v.parentUserId; createdAt = v.createdAt });
      };
      studentsMigrated := true;
    };
    // Seed Zahra Tinwala teacher account if not already present
    if (teacherCredentials.get("zahratinwala52@gmail.com") == null) {
      teacherCredentials.add("zahratinwala52@gmail.com", {
        email = "zahratinwala52@gmail.com";
        password = "msb123";
        name = "Zahra Tinwala";
        claimedBy = null;
      });
    };
    // Seed Admin account if not already present
    if (teacherCredentials.get(ADMIN_EMAIL) == null) {
      teacherCredentials.add(ADMIN_EMAIL, {
        email = ADMIN_EMAIL;
        password = "msb123";
        name = "Admin";
        claimedBy = null;
      });
    };
  };

  type HifzEntry = {
    id : Nat; studentId : Nat; date : Text; jadeedSurah : Text;
    jadeedAyatFrom : Nat; jadeedAyatTo : Nat; murajaatDetails : Text;
    juzHaaliMark : Text; notes : ?Text; createdAt : Time.Time;
  };

  module HifzEntry {
    public func compareByDateDescending(a : HifzEntry, b : HifzEntry) : Order.Order { Text.compare(b.date, a.date) };
  };

  let hifzEntries = Map.empty<Nat, HifzEntry>();
  var nextStudentId = 1;
  var nextHifzEntryId = 1;

  public shared ({ caller }) func createStudent(input : { name : Text; studentClass : Text; section : Text; parentWhatsapp : Text }) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized: Only teachers can create students") };
    let student : Student = { id = nextStudentId; name = input.name; studentClass = input.studentClass; section = input.section; parentWhatsapp = input.parentWhatsapp; teacherId = caller; parentUserId = null; createdAt = Time.now() };
    studentsV2.add(nextStudentId, student);
    let createdId = nextStudentId;
    nextStudentId += 1;
    createdId;
  };

  public shared ({ caller }) func updateStudent(studentId : Nat, input : { name : Text; studentClass : Text; section : Text; parentWhatsapp : Text }) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    switch (studentsV2.get(studentId)) {
      case (?student) {
        if (student.teacherId != caller) { Runtime.trap("Unauthorized: Cannot update student") };
        studentsV2.add(studentId, { id = student.id; name = input.name; studentClass = input.studentClass; section = input.section; parentWhatsapp = input.parentWhatsapp; teacherId = student.teacherId; parentUserId = student.parentUserId; createdAt = student.createdAt });
      };
      case (null) { Runtime.trap("Student not found") };
    };
  };

  public shared ({ caller }) func deleteStudent(studentId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    switch (studentsV2.get(studentId)) {
      case (?student) {
        if (student.teacherId != caller) { Runtime.trap("Unauthorized") };
        studentsV2.remove(studentId);
      };
      case (null) { Runtime.trap("Student not found") };
    };
  };

  public shared ({ caller }) func linkParentToStudent(studentId : Nat, parentUserId : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    switch (studentsV2.get(studentId)) {
      case (?student) {
        if (student.teacherId != caller) { Runtime.trap("Unauthorized") };
        studentsV2.add(studentId, { id = student.id; name = student.name; studentClass = student.studentClass; section = student.section; parentWhatsapp = student.parentWhatsapp; teacherId = student.teacherId; parentUserId = ?parentUserId; createdAt = student.createdAt });
      };
      case (null) { Runtime.trap("Student not found") };
    };
  };

  public shared ({ caller }) func createHifzEntry(input : { studentId : Nat; date : Text; jadeedSurah : Text; jadeedAyatFrom : Nat; jadeedAyatTo : Nat; murajaatDetails : Text; juzHaaliMark : Text; notes : ?Text }) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    switch (studentsV2.get(input.studentId)) {
      case (?student) {
        if (student.teacherId != caller) { Runtime.trap("Unauthorized") };
        let entry : HifzEntry = { id = nextHifzEntryId; studentId = input.studentId; date = input.date; jadeedSurah = input.jadeedSurah; jadeedAyatFrom = input.jadeedAyatFrom; jadeedAyatTo = input.jadeedAyatTo; murajaatDetails = input.murajaatDetails; juzHaaliMark = input.juzHaaliMark; notes = input.notes; createdAt = Time.now() };
        hifzEntries.add(nextHifzEntryId, entry);
        let createdId = nextHifzEntryId;
        nextHifzEntryId += 1;
        createdId;
      };
      case (null) { Runtime.trap("Student not found") };
    };
  };

  public type HifzEntryInput = { date : Text; jadeedSurah : Text; jadeedAyatFrom : Nat; jadeedAyatTo : Nat; murajaatDetails : Text; juzHaaliMark : Text; notes : ?Text };

  public shared ({ caller }) func updateHifzEntry(entryId : Nat, input : HifzEntryInput) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    switch (hifzEntries.get(entryId)) {
      case (?entry) {
        switch (studentsV2.get(entry.studentId)) {
          case (?student) {
            if (student.teacherId != caller) { Runtime.trap("Unauthorized") };
            hifzEntries.add(entryId, { id = entry.id; studentId = entry.studentId; date = input.date; jadeedSurah = input.jadeedSurah; jadeedAyatFrom = input.jadeedAyatFrom; jadeedAyatTo = input.jadeedAyatTo; murajaatDetails = input.murajaatDetails; juzHaaliMark = input.juzHaaliMark; notes = input.notes; createdAt = entry.createdAt });
          };
          case (null) { Runtime.trap("Student not found") };
        };
      };
      case (null) { Runtime.trap("Hifz entry not found") };
    };
  };

  public shared ({ caller }) func deleteHifzEntry(entryId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    switch (hifzEntries.get(entryId)) {
      case (?entry) {
        switch (studentsV2.get(entry.studentId)) {
          case (?student) {
            if (student.teacherId != caller) { Runtime.trap("Unauthorized") };
            hifzEntries.remove(entryId);
          };
          case (null) { Runtime.trap("Student not found") };
        };
      };
      case (null) { Runtime.trap("Hifz entry not found") };
    };
  };

  public query ({ caller }) func getStudentsForTeacher() : async [Student] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    studentsV2.values().toArray().filter(func(s) { s.teacherId == caller }).sort();
  };

  public query ({ caller }) func getEntriesForStudent(studentId : Nat) : async [HifzEntry] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    switch (studentsV2.get(studentId)) {
      case (?student) {
        if (student.teacherId != caller and student.parentUserId != ?caller) { Runtime.trap("Unauthorized") };
        hifzEntries.values().toArray().filter(func(e) { e.studentId == studentId }).sort(HifzEntry.compareByDateDescending);
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getStudentsForParent() : async [Student] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    studentsV2.values().toArray().filter(func(s) { s.parentUserId == ?caller }).sort();
  };

  public query ({ caller }) func getStudent(studentId : Nat) : async ?Student {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    switch (studentsV2.get(studentId)) {
      case (?student) {
        if (student.teacherId == caller or student.parentUserId == ?caller or isAdminCaller(caller)) { ?student } else { Runtime.trap("Unauthorized") };
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getHifzEntry(entryId : Nat) : async ?HifzEntry {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    switch (hifzEntries.get(entryId)) {
      case (?entry) {
        switch (studentsV2.get(entry.studentId)) {
          case (?student) {
            if (student.teacherId == caller or student.parentUserId == ?caller) { ?entry } else { Runtime.trap("Unauthorized") };
          };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };

  // ---- Admin-only student management ----
  public type StudentWithTeacher = {
    id : Nat; name : Text; studentClass : Text; section : Text; parentWhatsapp : Text;
    teacherId : Principal; teacherEmail : Text; teacherName : Text;
    parentUserId : ?Principal; createdAt : Time.Time;
  };

  public query ({ caller }) func adminGetAllStudents() : async [StudentWithTeacher] {
    if (not isAdminCaller(caller)) { Runtime.trap("Unauthorized: Admin only") };
    studentsV2.values().toArray().map(func(s : Student) : StudentWithTeacher {
      let teacherEmail = switch (userEmails.get(s.teacherId)) { case (?e) e; case null "" };
      let teacherName = switch (userProfiles.get(s.teacherId)) { case (?p) p.name; case null "" };
      { id = s.id; name = s.name; studentClass = s.studentClass; section = s.section; parentWhatsapp = s.parentWhatsapp; teacherId = s.teacherId; teacherEmail; teacherName; parentUserId = s.parentUserId; createdAt = s.createdAt };
    });
  };

  public shared ({ caller }) func adminDeleteStudent(studentId : Nat) : async () {
    if (not isAdminCaller(caller)) { Runtime.trap("Unauthorized: Admin only") };
    switch (studentsV2.get(studentId)) {
      case (?_) { studentsV2.remove(studentId) };
      case (null) { Runtime.trap("Student not found") };
    };
  };

  public shared ({ caller }) func adminTransferStudent(studentId : Nat, targetTeacherEmail : Text) : async () {
    if (not isAdminCaller(caller)) { Runtime.trap("Unauthorized: Admin only") };
    var targetPrincipal : ?Principal = null;
    for ((principal, email) in userEmails.entries()) {
      if (email == targetTeacherEmail) { targetPrincipal := ?principal };
    };
    switch (targetPrincipal) {
      case (?tp) {
        switch (studentsV2.get(studentId)) {
          case (?student) {
            studentsV2.add(studentId, { id = student.id; name = student.name; studentClass = student.studentClass; section = student.section; parentWhatsapp = student.parentWhatsapp; teacherId = tp; parentUserId = student.parentUserId; createdAt = student.createdAt });
          };
          case (null) { Runtime.trap("Student not found") };
        };
      };
      case (null) { Runtime.trap("No teacher found with that email") };
    };
  };
};
