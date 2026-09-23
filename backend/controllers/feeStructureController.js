import FeeStructure from "../models/FeeStructure.js";

// GET /api/fee-structures
export const listFeeStructures = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    if (req.query.year) filter.year = req.query.year;
    if (req.query.status) filter.status = req.query.status;

    const list = await FeeStructure.find(filter).sort({
      academicYear: -1,
      year: 1,
      semester: 1,
    });

    res.json(list);
  } catch (err) {
    next(err);
  }
};

// GET /api/fee-structures/lookup?academicYear=...&year=...&semester=...
export const lookupFeeStructure = async (req, res, next) => {
  try {
    const { academicYear, year, semester } = req.query;
    if (!academicYear || !year || !semester) {
      return res
        .status(400)
        .json({ message: "academicYear, year, semester required" });
    }

    const fee = await FeeStructure.findOne({
      academicYear,
      year: Number(year),
      semester: Number(semester),
      status: "active",
    });

    res.json(fee);
  } catch (err) {
    next(err);
  }
};

// POST /api/fee-structures (admin)
export const createFeeStructure = async (req, res, next) => {
  try {
    const { academicYear, year, semester, amount, dueDate, description } =
      req.body;

    const existing = await FeeStructure.findOne({
      academicYear,
      year,
      semester,
    });
    if (existing) {
      return res.status(400).json({
        message: "Fee structure already exists for this year/semester",
      });
    }

    const fee = await FeeStructure.create({
      academicYear,
      year,
      semester,
      amount,
      dueDate,
      description,
    });

    res.status(201).json(fee);
  } catch (err) {
    next(err);
  }
};

// PUT /api/fee-structures/:id (admin)
export const updateFeeStructure = async (req, res, next) => {
  try {
    const fee = await FeeStructure.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!fee) return res.status(404).json({ message: "Fee structure not found" });
    res.json(fee);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/fee-structures/:id (admin)
export const deleteFeeStructure = async (req, res, next) => {
  try {
    await FeeStructure.findByIdAndDelete(req.params.id);
    res.json({ message: "Fee structure deleted" });
  } catch (err) {
    next(err);
  }
};

// POST /api/fee-structures/bulk-defaults (admin)
// Creates the standard $200/$180 structure for all 4 years × 2 semesters
export const createDefaultStructure = async (req, res, next) => {
  try {
    const { academicYear } = req.body;
    if (!academicYear) {
      return res.status(400).json({ message: "academicYear required" });
    }

    const defaults = [];
    for (let year = 1; year <= 4; year++) {
      defaults.push({
        academicYear,
        year,
        semester: 1,
        amount: 200,
        description: `Year ${year} · Semester 1`,
      });
      defaults.push({
        academicYear,
        year,
        semester: 2,
        amount: 180,
        description: `Year ${year} · Semester 2`,
      });
    }

    // Upsert each (skip if already exists)
    const created = [];
    for (const d of defaults) {
      const existing = await FeeStructure.findOne({
        academicYear: d.academicYear,
        year: d.year,
        semester: d.semester,
      });
      if (!existing) {
        const f = await FeeStructure.create(d);
        created.push(f);
      }
    }

    res.status(201).json({
      message: `${created.length} fee structures created`,
      created: created.length,
    });
  } catch (err) {
    next(err);
  }
};