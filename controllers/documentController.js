import Document from '../models/Document.js';

/**
 * Fetch all saved documents (cover letters & LinkedIn optimization summaries) for the logged-in user
 */
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve saved documents: ' + error.message });
  }
};

/**
 * Save or update a document for the logged-in user
 */
export const saveDocument = async (req, res) => {
  const { id, title, content, type } = req.body;
  
  if (!title || !content || !type) {
    return res.status(400).json({ error: 'Title, content, and document type are required.' });
  }

  try {
    if (id) {
      // Update existing document
      const doc = await Document.findOneAndUpdate(
        { _id: id, userId: req.userId },
        { title, content, type },
        { new: true }
      );
      if (!doc) {
        return res.status(404).json({ error: 'Document not found or unauthorized.' });
      }
      return res.json({ success: true, message: 'Document updated successfully', document: doc });
    } else {
      // Create new document
      const doc = new Document({
        title,
        content,
        type,
        userId: req.userId
      });
      await doc.save();
      return res.json({ success: true, message: 'Document saved successfully', document: doc });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to save document: ' + error.message });
  }
};

/**
 * Delete a saved document
 */
export const deleteDocument = async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await Document.findOneAndDelete({ _id: id, userId: req.userId });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or unauthorized.' });
    }
    res.json({ success: true, message: 'Document deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document: ' + error.message });
  }
};
