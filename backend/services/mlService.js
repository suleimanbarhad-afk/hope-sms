import { SimpleLinearRegression } from "ml-regression";


// ============================================================
// AT-RISK STUDENT DETECTION
// Logistic-like scoring based on weighted factors
// ============================================================
/**
 * Compute a risk score (0-100) for a student.
 * Higher = more likely to fail.
 */
export const computeRiskScore = ({
  attendancePercent = 100,
  avgMarks = 100,
  pendingFees = 0,
  gpaTrend = 0, // positive = improving, negative = declining
  failedCourses = 0,
}) => {
  let score = 0;

  // Attendance (0-40 points)
  if (attendancePercent < 50) score += 40;
  else if (attendancePercent < 65) score += 30;
  else if (attendancePercent < 75) score += 20;
  else if (attendancePercent < 85) score += 10;
  else score += 0;

  // Average marks (0-30 points)
  if (avgMarks < 40) score += 30;
  else if (avgMarks < 50) score += 20;
  else if (avgMarks < 60) score += 15;
  else if (avgMarks < 70) score += 5;
  else score += 0;

  // Pending fees (0-15 points)
  if (pendingFees > 1000) score += 15;
  else if (pendingFees > 500) score += 10;
  else if (pendingFees > 0) score += 5;

  // GPA trend (0-10 points)
  if (gpaTrend < -0.5) score += 10;
  else if (gpaTrend < -0.2) score += 5;
  else if (gpaTrend > 0.2) score -= 5; // improve = reduce risk

  // Failed courses (0-20 points)
  score += Math.min(failedCourses * 7, 20);

  // Clamp 0-100
  return Math.max(0, Math.min(100, score));
};

/**
 * Convert risk score to category
 */
export const riskCategory = (score) => {
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  if (score >= 15) return "low";
  return "safe";
};

// ============================================================
// GPA TRAJECTORY — Linear regression on GPA over time
// ============================================================
/**
 * Predict next semester GPA given historical data.
 * @param {Array} history - [{ semester: 1, gpa: 3.2 }, { semester: 2, gpa: 3.4 }, ...]
 * @returns {Object} { predicted, slope, r2, trend }
 */
export const predictGPA = (history) => {
  if (!history || history.length < 2) {
    return {
      predicted: history?.[0]?.gpa || 0,
      slope: 0,
      r2: 0,
      trend: "stable",
    };
  }

  const xs = history.map((h) => h.semester);
  const ys = history.map((h) => h.gpa);

  const regression = new SimpleLinearRegression(xs, ys);
  const nextSemester = Math.max(...xs) + 1;
  const predicted = Math.max(0, Math.min(4, regression.predict(nextSemester)));

  // Calculate R²
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const ssTot = ys.reduce((a, y) => a + Math.pow(y - yMean, 2), 0);
  const ssRes = ys.reduce(
    (a, y, i) => a + Math.pow(y - regression.predict(xs[i]), 2),
    0
  );
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  let trend = "stable";
  if (regression.slope > 0.1) trend = "improving";
  else if (regression.slope < -0.1) trend = "declining";

  return {
    predicted: +predicted.toFixed(2),
    slope: +regression.slope.toFixed(3),
    r2: +r2.toFixed(3),
    trend,
    history,
  };
};

// ============================================================
// FEE COLLECTION FORECAST — Predict next month
// ============================================================
/**
 * Predict next month's fee collection based on history.
 * @param {Array} monthlyData - [{ month: "2026-01", collected: 5000 }, ...]
 */
export const forecastFees = (monthlyData) => {
  if (!monthlyData || monthlyData.length < 2) {
    return {
      nextMonth: 0,
      trend: "unknown",
      confidence: 0,
      history: monthlyData || [],
    };
  }

  const xs = monthlyData.map((_, i) => i);
  const ys = monthlyData.map((d) => d.collected);

  const regression = new SimpleLinearRegression(xs, ys);
  const nextMonthIndex = xs.length;
  const predicted = Math.max(0, regression.predict(nextMonthIndex));

  // R² for confidence
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const ssTot = ys.reduce((a, y) => a + Math.pow(y - yMean, 2), 0);
  const ssRes = ys.reduce(
    (a, y, i) => a + Math.pow(y - regression.predict(xs[i]), 2),
    0
  );
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  let trend = "stable";
  if (regression.slope > 100) trend = "growing";
  else if (regression.slope < -100) trend = "declining";

  return {
    nextMonth: +predicted.toFixed(2),
    slope: +regression.slope.toFixed(2),
    trend,
    confidence: +r2.toFixed(2),
    history: monthlyData,
  };
};

// ============================================================
// ENROLLMENT FORECAST
// ============================================================
export const forecastEnrollment = (yearlyData) => {
  if (!yearlyData || yearlyData.length < 2) {
    return { nextYear: 0, trend: "unknown", history: yearlyData || [] };
  }

  const xs = yearlyData.map((_, i) => i);
  const ys = yearlyData.map((d) => d.count);

  const regression = new SimpleLinearRegression(xs, ys);
  const nextYear = Math.max(0, Math.round(regression.predict(xs.length)));

  let trend = "stable";
  if (regression.slope > 5) trend = "growing";
  else if (regression.slope < -5) trend = "declining";

  return {
    nextYear,
    slope: +regression.slope.toFixed(2),
    trend,
    history: yearlyData,
  };
};

// ============================================================
// PERFORMANCE CLUSTERING — Group students into tiers
// ============================================================
/**
 * Classify students into performance tiers.
 * @param {Array} students - [{ id, name, gpa, attendance, avgMarks }]
 */
export const clusterStudents = (students) => {
  if (!students || students.length === 0) return [];

  return students.map((s) => {
    // Composite score (0-100)
    const gpaScore = (s.gpa / 4) * 40; // 0-40
    const attendanceScore = (s.attendance / 100) * 30; // 0-30
    const marksScore = (s.avgMarks / 100) * 30; // 0-30
    const composite = +(gpaScore + attendanceScore + marksScore).toFixed(1);

    let tier;
    if (composite >= 80) tier = "excellent";
    else if (composite >= 65) tier = "good";
    else if (composite >= 50) tier = "average";
    else if (composite >= 35) tier = "below-average";
    else tier = "at-risk";

    return { ...s, composite, tier };
  });
};

// ============================================================
// SIMPLE MOVING AVERAGE — smooth noisy data
// ============================================================
export const movingAverage = (data, window = 3) => {
  if (!data || data.length < window) return data;
  const result = [];
  for (let i = window - 1; i < data.length; i++) {
    const slice = data.slice(i - window + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / window;
    result.push(+avg.toFixed(2));
  }
  return result;
};