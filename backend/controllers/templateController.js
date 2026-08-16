const EmailTemplate = require('../models/EmailTemplate');
const { getIsConnected, getMemoryStore } = require('../config/db');
const { logAudit } = require('../services/auditService');

const getTemplates = async (req, res) => {
  try {
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    if (isMongo) {
      const templates = await EmailTemplate.find().sort({ isPrebuilt: -1, createdAt: -1 });
      res.json(templates);
    } else {
      res.json(store.templates);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const { name, category, subject, bodyHtml, description } = req.body;

    if (!name || !subject || !bodyHtml) {
      return res.status(400).json({ message: 'Template name, subject, and content body are required' });
    }

    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let template;
    if (isMongo) {
      template = await EmailTemplate.create({
        name,
        category: category || 'Placement Drive',
        subject,
        bodyHtml,
        description: description || '',
        isPrebuilt: false,
        createdBy: req.user._id
      });
    } else {
      template = {
        _id: `tpl-${Date.now()}`,
        name,
        category: category || 'Placement Drive',
        subject,
        bodyHtml,
        description: description || '',
        isPrebuilt: false,
        createdBy: req.user._id,
        createdAt: new Date()
      };
      store.templates.unshift(template);
    }

    logAudit({
      action: 'CREATE_TEMPLATE',
      userEmail: req.user.email,
      userRole: req.user.role,
      details: `Created email template "${name}"`,
      targetEntity: template._id
    });

    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    let template;
    if (isMongo) {
      template = await EmailTemplate.findByIdAndUpdate(id, req.body, { new: true });
    } else {
      const idx = store.templates.findIndex(t => String(t._id) === String(id));
      if (idx !== -1) {
        store.templates[idx] = { ...store.templates[idx], ...req.body };
        template = store.templates[idx];
      }
    }

    if (!template) return res.status(404).json({ message: 'Template not found' });

    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const isMongo = getIsConnected();
    const store = getMemoryStore();

    if (isMongo) {
      await EmailTemplate.findByIdAndDelete(id);
    } else {
      store.templates = store.templates.filter(t => String(t._id) !== String(id));
    }

    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTemplates, createTemplate, updateTemplate, deleteTemplate };
