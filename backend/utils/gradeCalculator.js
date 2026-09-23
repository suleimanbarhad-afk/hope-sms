export const calculateGrade = (totalMarks, gradingSystem) => {
  const system = gradingSystem?.length
    ? gradingSystem
    : [
        { min: 80, max: 100, grade: "A", point: 4.0 },
        { min: 75, max: 79, grade: "B+", point: 3.5 },
        { min: 70, max: 74, grade: "B", point: 3.0 },
        { min: 65, max: 69, grade: "C+", point: 2.5 },
        { min: 60, max: 64, grade: "C", point: 2.0 },
        { min: 50, max: 59, grade: "D", point: 1.0 },
        { min: 0, max: 49, grade: "F", point: 0.0 },
      ];

  const entry = system.find((g) => totalMarks >= g.min && totalMarks <= g.max);
  return entry
    ? { grade: entry.grade, gradePoint: entry.point }
    : { grade: "F", gradePoint: 0 };
};

export const calculateTotal = ({
  attendanceMarks = 0,
  courseworkMarks = 0,
  testMarks = 0,
  examMarks = 0,
}) => {
  const total =
    Number(attendanceMarks) +
    Number(courseworkMarks) +
    Number(testMarks) +
    Number(examMarks);
  return Math.min(100, Math.max(0, total));
};

export const calculateGPA = (results) => {
  if (!results.length) return { gpa: 0, totalCredits: 0 };
  let totalPoints = 0;
  let totalCredits = 0;
  results.forEach((r) => {
    const credits = r.course?.creditHours || 0;
    totalPoints += (r.gradePoint || 0) * credits;
    totalCredits += credits;
  });
  return {
    gpa: totalCredits ? +(totalPoints / totalCredits).toFixed(2) : 0,
    totalCredits,
  };
};