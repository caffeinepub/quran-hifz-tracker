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
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    role : Text; // "user" (teacher) or "guest" (parent)
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  // getCallerUserProfile: allow any logged-in principal (no role required,
  // since new users call this before they have a role).
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // saveCallerUserProfile: allow any logged-in principal.
  // Also registers the caller in access control with the appropriate role
  // (teacher -> #user, parent -> #guest) if not already registered.
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    userProfiles.add(caller, profile);
    // Register the caller's role if they don't have one yet
    switch (accessControlState.userRoles.get(caller)) {
      case (null) {
        let acRole : AccessControl.UserRole = if (profile.role == "guest") { #guest } else { #user };
        accessControlState.userRoles.add(caller, acRole);
      };
      case (?_) {}; // already registered, leave as-is
    };
  };

  // -----------------------------------------------------------------------
  // Student type definitions
  // -----------------------------------------------------------------------

  type StudentLegacy = {
    id : Nat;
    name : Text;
    teacherId : Principal;
    parentUserId : ?Principal;
    createdAt : Time.Time;
  };

  type Student = {
    id : Nat;
    name : Text;
    studentClass : Text;
    section : Text;
    parentWhatsapp : Text;
    teacherId : Principal;
    parentUserId : ?Principal;
    createdAt : Time.Time;
  };

  module Student {
    public func compare(s1 : Student, s2 : Student) : Order.Order {
      Text.compare(s1.name, s2.name);
    };
  };

  let students = Map.empty<Nat, StudentLegacy>(); // legacy — migrated on postupgrade
  let studentsV2 = Map.empty<Nat, Student>();     // current
  var studentsMigrated = false;

  system func postupgrade() {
    if (not studentsMigrated) {
      for ((k, v) in students.entries()) {
        studentsV2.add(k, {
          id = v.id;
          name = v.name;
          studentClass = "";
          section = "";
          parentWhatsapp = "";
          teacherId = v.teacherId;
          parentUserId = v.parentUserId;
          createdAt = v.createdAt;
        });
      };
      studentsMigrated := true;
    };
  };

  type HifzEntry = {
    id : Nat;
    studentId : Nat;
    date : Text;
    jadeedSurah : Text;
    jadeedAyatFrom : Nat;
    jadeedAyatTo : Nat;
    murajaatDetails : Text;
    juzHaaliMark : Text;
    notes : ?Text;
    createdAt : Time.Time;
  };

  module HifzEntry {
    public func compareByDateDescending(a : HifzEntry, b : HifzEntry) : Order.Order {
      Text.compare(b.date, a.date);
    };
  };

  let hifzEntries = Map.empty<Nat, HifzEntry>();

  var nextStudentId = 1;
  var nextHifzEntryId = 1;

  // Student management
  public shared ({ caller }) func createStudent(input : {
    name : Text;
    studentClass : Text;
    section : Text;
    parentWhatsapp : Text;
  }) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only teachers can create students");
    };
    let student : Student = {
      id = nextStudentId;
      name = input.name;
      studentClass = input.studentClass;
      section = input.section;
      parentWhatsapp = input.parentWhatsapp;
      teacherId = caller;
      parentUserId = null;
      createdAt = Time.now();
    };
    studentsV2.add(nextStudentId, student);
    let createdId = nextStudentId;
    nextStudentId += 1;
    createdId;
  };

  public shared ({ caller }) func updateStudent(studentId : Nat, input : {
    name : Text;
    studentClass : Text;
    section : Text;
    parentWhatsapp : Text;
  }) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only teachers can update students");
    };
    switch (studentsV2.get(studentId)) {
      case (?student) {
        if (student.teacherId != caller) {
          Runtime.trap("Unauthorized: Cannot update student");
        };
        let updatedStudent : Student = {
          id = student.id;
          name = input.name;
          studentClass = input.studentClass;
          section = input.section;
          parentWhatsapp = input.parentWhatsapp;
          teacherId = student.teacherId;
          parentUserId = student.parentUserId;
          createdAt = student.createdAt;
        };
        studentsV2.add(studentId, updatedStudent);
      };
      case (null) { Runtime.trap("Student not found") };
    };
  };

  public shared ({ caller }) func deleteStudent(studentId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only teachers can delete students");
    };
    switch (studentsV2.get(studentId)) {
      case (?student) {
        if (student.teacherId != caller) {
          Runtime.trap("Unauthorized: Cannot delete student");
        };
        studentsV2.remove(studentId);
      };
      case (null) { Runtime.trap("Student not found") };
    };
  };

  public shared ({ caller }) func linkParentToStudent(studentId : Nat, parentUserId : Principal) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only teachers can link parents");
    };
    switch (studentsV2.get(studentId)) {
      case (?student) {
        if (student.teacherId != caller) {
          Runtime.trap("Unauthorized: Cannot link parent");
        };
        let updatedStudent : Student = {
          id = student.id;
          name = student.name;
          studentClass = student.studentClass;
          section = student.section;
          parentWhatsapp = student.parentWhatsapp;
          teacherId = student.teacherId;
          parentUserId = ?parentUserId;
          createdAt = student.createdAt;
        };
        studentsV2.add(studentId, updatedStudent);
      };
      case (null) { Runtime.trap("Student not found") };
    };
  };

  // HifzEntry management
  public shared ({ caller }) func createHifzEntry(input : {
    studentId : Nat;
    date : Text;
    jadeedSurah : Text;
    jadeedAyatFrom : Nat;
    jadeedAyatTo : Nat;
    murajaatDetails : Text;
    juzHaaliMark : Text;
    notes : ?Text;
  }) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only teachers can create hifz entries");
    };
    switch (studentsV2.get(input.studentId)) {
      case (?student) {
        if (student.teacherId != caller) {
          Runtime.trap("Unauthorized: Cannot create hifz entry");
        };
        let hifzEntry : HifzEntry = {
          id = nextHifzEntryId;
          studentId = input.studentId;
          date = input.date;
          jadeedSurah = input.jadeedSurah;
          jadeedAyatFrom = input.jadeedAyatFrom;
          jadeedAyatTo = input.jadeedAyatTo;
          murajaatDetails = input.murajaatDetails;
          juzHaaliMark = input.juzHaaliMark;
          notes = input.notes;
          createdAt = Time.now();
        };
        hifzEntries.add(nextHifzEntryId, hifzEntry);
        let createdId = nextHifzEntryId;
        nextHifzEntryId += 1;
        createdId;
      };
      case (null) { Runtime.trap("Student not found") };
    };
  };

  public type HifzEntryInput = {
    date : Text;
    jadeedSurah : Text;
    jadeedAyatFrom : Nat;
    jadeedAyatTo : Nat;
    murajaatDetails : Text;
    juzHaaliMark : Text;
    notes : ?Text;
  };

  public shared ({ caller }) func updateHifzEntry(entryId : Nat, input : HifzEntryInput) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only teachers can update hifz entries");
    };
    switch (hifzEntries.get(entryId)) {
      case (?entry) {
        switch (studentsV2.get(entry.studentId)) {
          case (?student) {
            if (student.teacherId != caller) {
              Runtime.trap("Unauthorized: Cannot update hifz entry");
            };
            let updatedEntry : HifzEntry = {
              id = entry.id;
              studentId = entry.studentId;
              date = input.date;
              jadeedSurah = input.jadeedSurah;
              jadeedAyatFrom = input.jadeedAyatFrom;
              jadeedAyatTo = input.jadeedAyatTo;
              murajaatDetails = input.murajaatDetails;
              juzHaaliMark = input.juzHaaliMark;
              notes = input.notes;
              createdAt = entry.createdAt;
            };
            hifzEntries.add(entryId, updatedEntry);
          };
          case (null) { Runtime.trap("Student not found") };
        };
      };
      case (null) { Runtime.trap("Hifz entry not found") };
    };
  };

  public shared ({ caller }) func deleteHifzEntry(entryId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only teachers can delete hifz entries");
    };
    switch (hifzEntries.get(entryId)) {
      case (?entry) {
        switch (studentsV2.get(entry.studentId)) {
          case (?student) {
            if (student.teacherId != caller) {
              Runtime.trap("Unauthorized: Cannot delete hifz entry");
            };
            hifzEntries.remove(entryId);
          };
          case (null) { Runtime.trap("Student not found") };
        };
      };
      case (null) { Runtime.trap("Hifz entry not found") };
    };
  };

  // Queries
  public query ({ caller }) func getStudentsForTeacher() : async [Student] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only teachers can get their students");
    };
    studentsV2.values().toArray().filter(func(s) { s.teacherId == caller }).sort();
  };

  public query ({ caller }) func getEntriesForStudent(studentId : Nat) : async [HifzEntry] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view entries");
    };
    switch (studentsV2.get(studentId)) {
      case (?student) {
        if (student.teacherId != caller and student.parentUserId != ?caller) {
          Runtime.trap("Unauthorized: Cannot view entries");
        };
        hifzEntries.values().toArray().filter(func(e) { e.studentId == studentId }).sort(HifzEntry.compareByDateDescending);
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getStudentsForParent() : async [Student] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only parents can get their students");
    };
    studentsV2.values().toArray().filter(func(s) { s.parentUserId == ?caller }).sort();
  };

  public query ({ caller }) func getStudent(studentId : Nat) : async ?Student {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view students");
    };
    switch (studentsV2.get(studentId)) {
      case (?student) {
        if (student.teacherId == caller or student.parentUserId == ?caller) {
          ?student;
        } else {
          Runtime.trap("Unauthorized: Cannot view this student");
        };
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getHifzEntry(entryId : Nat) : async ?HifzEntry {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view hifz entries");
    };
    switch (hifzEntries.get(entryId)) {
      case (?entry) {
        switch (studentsV2.get(entry.studentId)) {
          case (?student) {
            if (student.teacherId == caller or student.parentUserId == ?caller) {
              ?entry;
            } else {
              Runtime.trap("Unauthorized: Cannot view this hifz entry");
            };
          };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };
};
