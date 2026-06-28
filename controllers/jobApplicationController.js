import JobApplication from '../models/JobApplication.js';

/**
 * Fetch all saved job applications for the logged-in user
 */
export const getJobApplications = async (req, res) => {
  try {
    const apps = await JobApplication.find({ userId: req.userId }).sort({ updatedAt: -1 });
    // Map _id to id for client convenience
    const mapped = apps.map(app => ({
      id: app._id,
      company: app.company,
      role: app.role,
      salary: app.salary,
      status: app.status,
      date: app.date,
      notes: app.notes,
      url: app.url,
      resumeId: app.resumeId,
      coverLetterId: app.coverLetterId,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve job applications: ' + error.message });
  }
};

/**
 * Create a new job application
 */
export const createJobApplication = async (req, res) => {
  const { company, role, salary, status, date, notes, url, resumeId, coverLetterId } = req.body;

  if (!company || !role) {
    return res.status(400).json({ error: 'Company and Role are required fields.' });
  }

  try {
    const newApp = new JobApplication({
      userId: req.userId,
      company,
      role,
      salary: salary || '',
      status: status || 'wishlist',
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || '',
      url: url || '',
      resumeId: resumeId || null,
      coverLetterId: coverLetterId || null
    });

    await newApp.save();
    
    res.status(201).json({
      success: true,
      message: 'Job application created successfully.',
      job: {
        id: newApp._id,
        company: newApp.company,
        role: newApp.role,
        salary: newApp.salary,
        status: newApp.status,
        date: newApp.date,
        notes: newApp.notes,
        url: newApp.url,
        resumeId: newApp.resumeId,
        coverLetterId: newApp.coverLetterId,
        createdAt: newApp.createdAt,
        updatedAt: newApp.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create job application: ' + error.message });
  }
};

/**
 * Update an existing job application
 */
export const updateJobApplication = async (req, res) => {
  const { id } = req.params;
  const { company, role, salary, status, date, notes, url, resumeId, coverLetterId } = req.body;

  try {
    const app = await JobApplication.findById(id);
    if (!app) {
      return res.status(404).json({ error: 'Job application not found.' });
    }

    if (app.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to modify this job application.' });
    }

    // Update fields
    if (company !== undefined) app.company = company;
    if (role !== undefined) app.role = role;
    if (salary !== undefined) app.salary = salary;
    if (status !== undefined) app.status = status;
    if (date !== undefined) app.date = date;
    if (notes !== undefined) app.notes = notes;
    if (url !== undefined) app.url = url;
    
    // Convert empty strings to null for ObjectId references
    if (resumeId !== undefined) {
      app.resumeId = resumeId || null;
    }
    if (coverLetterId !== undefined) {
      app.coverLetterId = coverLetterId || null;
    }

    app.updatedAt = new Date();
    await app.save();

    res.json({
      success: true,
      message: 'Job application updated successfully.',
      job: {
        id: app._id,
        company: app.company,
        role: app.role,
        salary: app.salary,
        status: app.status,
        date: app.date,
        notes: app.notes,
        url: app.url,
        resumeId: app.resumeId,
        coverLetterId: app.coverLetterId,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update job application: ' + error.message });
  }
};

/**
 * Delete a job application
 */
export const deleteJobApplication = async (req, res) => {
  const { id } = req.params;

  try {
    const app = await JobApplication.findById(id);
    if (!app) {
      return res.status(404).json({ error: 'Job application not found.' });
    }

    if (app.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this job application.' });
    }

    await JobApplication.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Job application deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete job application: ' + error.message });
  }
};
