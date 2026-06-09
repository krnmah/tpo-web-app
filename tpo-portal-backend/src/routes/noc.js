const express = require('express');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { session, companyName, startDate, endDate, name, enrollment, branch } = req.body;

    // Validate required fields
    if (!session || !companyName || !startDate || !endDate || !name || !enrollment || !branch) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Read the template file
    const templatePath = path.join(__dirname, '..', '..', 'templates', 'noc-template.docx');
    const content = fs.readFileSync(templatePath, 'binary');

    // Create a PizZip instance
    const zip = new PizZip(content);

    // Create a Docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '{{',
        end: '}}'
      }
    });

    // Get current date in DD-MM-YYYY format
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

    // Fill the template with data
    doc.render({
      Session: session,
      Date: formattedDate,
      COMPANY_NAME: companyName,
      START_DATE: startDate,
      END_DATE: endDate,
      Name: name,
      Enrollment: enrollment,
      Branch: branch,
    });

    // Generate the document
    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    // Set headers for file download
    const fileName = `NOC_${name.replace(/\s+/g, '_')}_${companyName.replace(/\s+/g, '_')}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buf.length);

    // Send the file
    res.send(buf);
  } catch (error) {
    logger.error('Error generating NOC', { error: error.message });
    res.status(500).json({ error: 'Failed to generate NOC document' });
  }
});

module.exports = router;
