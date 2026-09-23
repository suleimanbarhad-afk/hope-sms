export const calculateGrade = (marks, gradingSystem) => {
  const entry = gradingSystem.find((g) => marks >= g.min && marks <= g.max);
  return entry ? { grade: entry.grade, gradePoint: entry.point } : { grade: "F", gradePoint: 0 };
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