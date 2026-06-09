const fs = require('fs');
const path = require('path');
const XLSX = require('../../tpo-portal-frontend/node_modules/xlsx');
const bcrypt = require('bcryptjs');

const WORKBOOK_PATH = path.resolve(__dirname, '../../Placement Eligibility Sheet 2026.xlsx');
const OUT_DIR = path.resolve(__dirname, '../prisma/imports/placement-2026');
const PLACEHOLDER_PDF = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
const DEFAULT_PASSWORD = 'Student@2026';
const NOW = new Date().toISOString();

const USER_ID_START = 10000;
const COMPANY_ID_START = 20000;
const JOB_ID_START = 30000;
const APPLICATION_ID_START = 40000;

const BRANCH_ENUM = Object.freeze({
  CHEMICAL: 'Chemical Engineering',
  CIVIL: 'Civil Engineering',
  CSE: 'Computer Science and Engineering',
  ELECTRICAL: 'Electrical Engineering',
  ECE: 'Electronics and Communication Engineering',
  IT: 'Information Technology',
  MECHANICAL: 'Mechanical Engineering',
  MME: 'Metallurgical and Materials Engineering'
});

const norm = (value) => String(value ?? '')
  .replace(/\r?\n/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const lower = (value) => norm(value).toLowerCase();
const upper = (value) => norm(value).toUpperCase();

const validEmail = (value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(lower(value));
const validInstituteEmail = (value) => validEmail(value) && lower(value).endsWith('@nitsri.ac.in');
const validUrl = (value) => /^https?:\/\//i.test(norm(value));

const excelDateToIso = (value) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '';
  const parsed = XLSX.SSF.parse_date_code(value);
  if (!parsed) return '';
  return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, Math.floor(parsed.S || 0))).toISOString();
};

const parseNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = upper(value);
  if (!text || ['NA', 'N/A', 'LO', 'LOW', 'NONE', 'NULL', '-', 'NO'].includes(text)) return null;
  const match = text.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const parseMobile = (value) => {
  let digits = norm(value).replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(-10);
  return /^[6-9]\d{9}$/.test(digits) ? digits : '';
};

const parseCategory = (categoryValue, pwdValue) => {
  if (/^yes$/i.test(norm(pwdValue))) return 'PWD';

  const raw = upper(categoryValue).replace(/[.\s-]+/g, '_');
  if (!raw) return 'GENERAL';
  if (raw.includes('GEN') && raw.includes('EWS')) return 'GEN_EWS';
  if (raw === 'GENERAL' || raw === 'GEN') return 'GENERAL';
  if (raw.includes('OBC')) return 'OBC';
  if (raw === 'SC' || raw.includes('SCHEDULED_CASTE')) return 'SC';
  if (raw === 'ST' || raw.includes('SCHEDULED_TRIBE')) return 'ST';
  if (raw.includes('PWD') || raw.includes('DISABILITY')) return 'PWD';
  return 'GENERAL';
};

const parseGender = (value) => {
  const raw = upper(value);
  if (raw.startsWith('M')) return 'MALE';
  if (raw.startsWith('F')) return 'FEMALE';
  if (raw) return 'OTHER';
  return '';
};

const canonicalKey = (value) => lower(value)
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const cleanCompanyName = (value) => {
  const text = norm(value);
  const raw = upper(text);
  if (
    !text ||
    validEmail(text) ||
    ['NA', 'N/A', 'NONE', 'NULL', 'NIL', 'NO', '-', 'LO', 'LOW'].includes(raw) ||
    /^\d+(\.\d+)?$/.test(text)
  ) {
    return '';
  }
  return text;
};

const canonicalCompanyName = (name) => {
  const key = canonicalKey(name);
  const aliases = {
    accmegrade: 'Acmegrade',
    acmegarde: 'Acmegrade',
    acmegrade: 'Acmegrade',
    'aditya birla': 'Aditya Birla Group',
    'aditya birla group': 'Aditya Birla Group',
    'agarwal classes': 'Agarwal Classes',
    'aggarwal classes': 'Agarwal Classes',
    'darwix ai': 'Darwix AI',
    darwixai: 'Darwix AI',
    eduveda: 'Eduveda Academy',
    'eduveda academy': 'Eduveda Academy',
    epack: 'EPACK Prefab',
    'epack prefab': 'EPACK Prefab',
    'epack prefab': 'EPACK Prefab',
    epam: 'EPAM Systems',
    'epam systems': 'EPAM Systems',
    'grow your skills': 'Grow Your Skills LLP',
    'grow your skills llp': 'Grow Your Skills LLP',
    'hero steel': 'Hero Steels',
    'hero steels': 'Hero Steels',
    hpcl: 'HPCL',
    'hpcl psu': 'HPCL',
    icici: 'ICICI Bank',
    'icici bank': 'ICICI Bank',
    jyesta: 'Jyesta',
    'jyesta corporate entity': 'Jyesta',
    'l and t': 'L&T',
    'larsen and toubro': 'L&T',
    mahindra: 'Mahindra AFS',
    'mahindra afs': 'Mahindra AFS',
    'mahindra and mahindra afs': 'Mahindra AFS',
    'morphle labs': 'Morphle Labs',
    'nyera s eductec': "Nyera's Edutec",
    'nyera s edutec': "Nyera's Edutec",
    'nyeras edutec': "Nyera's Edutec",
    orc: 'ORC Engineering',
    'orc engineering': 'ORC Engineering',
    'orc ltd': 'ORC Engineering',
    p3c: 'P3C Tech',
    'p3c tech': 'P3C Tech',
    'physics wallah': 'Physics Wallah',
    pw: 'Physics Wallah',
    quantiphi: 'Quantiphi',
    infineon: 'Infineon',
    'samsung r and d': 'Samsung R&D',
    'samsung r and d noida': 'Samsung R&D',
    'vedanta': 'Vedanta Limited',
    'vedanta limited': 'Vedanta Limited'
  };

  return aliases[key] || norm(name);
};

const branchAliases = new Map([
  ['CHE', BRANCH_ENUM.CHEMICAL],
  ['Chemical Engineering', BRANCH_ENUM.CHEMICAL],
  ['CIV', BRANCH_ENUM.CIVIL],
  ['Civil Engineering', BRANCH_ENUM.CIVIL],
  ['CSE', BRANCH_ENUM.CSE],
  ['Computer Science & Engineering', BRANCH_ENUM.CSE],
  ['Computer Science and Engineering', BRANCH_ENUM.CSE],
  ['ELE', BRANCH_ENUM.ELECTRICAL],
  ['Electrical Engineering', BRANCH_ENUM.ELECTRICAL],
  ['ECE', BRANCH_ENUM.ECE],
  ['Electronics and Communication E', BRANCH_ENUM.ECE],
  ['Electronics and Communication Engineering', BRANCH_ENUM.ECE],
  ['IT', BRANCH_ENUM.IT],
  ['Information Technology', BRANCH_ENUM.IT],
  ['MEC', BRANCH_ENUM.MECHANICAL],
  ['Mechanical Engineering', BRANCH_ENUM.MECHANICAL],
  ['MME', BRANCH_ENUM.MME],
  ['Metallurgical and Materials Eng', BRANCH_ENUM.MME],
  ['Metallurgical and Materials Engineering', BRANCH_ENUM.MME]
].map(([alias, branch]) => [canonicalKey(alias), branch]));

const normalizeBranchName = (value) => {
  return branchAliases.get(canonicalKey(value)) || '';
};

const branchName = (sheetName) => normalizeBranchName(sheetName);

const findHeaderRow = (rows) => rows.findIndex((row) => row.some((cell) => /enrol+l?ment|enrollment/i.test(norm(cell))));
const isSubHeader = (row) => row && row.some((cell) => /^(COMPANY(\s*\d+)?|COMPANY NAME|ROLE|BASE PAY|CTC|DATE|PACKAGE|OFFER TYPE|INTERN STIPEND)$/i.test(norm(cell)));
const findCol = (headers, patterns) => headers.findIndex((header) => patterns.some((pattern) => lower(header).includes(pattern)));

const pgArray = (items) => {
  if (!items || !items.length) return '{}';
  return `{${items.map((item) => `"${String(item).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`;
};

const csvEscape = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

const writeCsv = (filename, headers, rows) => {
  const body = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
  ].join('\n');
  fs.writeFileSync(path.join(OUT_DIR, filename), `${body}\n`, 'utf8');
};

const companyDescription = (name, branches, roles) => {
  const key = canonicalKey(name);
  const known = {
    'l and t': 'Larsen and Toubro is an Indian multinational engineering, construction, manufacturing, technology and financial services company.',
    'larsen and toubro': 'Larsen and Toubro is an Indian multinational engineering, construction, manufacturing, technology and financial services company.',
    infosys: 'Infosys is a global information technology services and consulting company headquartered in India.',
    accenture: 'Accenture is a global professional services company focused on digital, cloud, technology and operations consulting.',
    hsbc: 'HSBC is a global banking and financial services organisation serving retail, commercial and institutional customers.',
    oracle: 'Oracle is a global technology company known for database software, cloud infrastructure and enterprise applications.',
    'hcl tech': 'HCLTech is an Indian multinational technology company providing IT services, engineering and digital transformation solutions.',
    cris: 'CRIS develops and manages information systems for Indian Railways and related railway operations.',
    jsw: 'JSW Group is an Indian conglomerate with major businesses in steel, energy, infrastructure, cement and related sectors.',
    vedanta: 'Vedanta is a diversified natural resources company operating in metals, mining, oil and gas, and power.',
    'vedanta limited': 'Vedanta Limited is a diversified natural resources company with operations across metals, mining, oil and gas, and power.',
    'tata power ddl': 'Tata Power Delhi Distribution Limited is an electricity distribution company serving consumers in North and North-West Delhi.',
    'icici bank': 'ICICI Bank is an Indian private sector bank offering retail, corporate and digital banking services.',
    'aditya birla group': 'Aditya Birla Group is an Indian multinational conglomerate with businesses across metals, cement, textiles, financial services and more.',
    'aditya birla': 'Aditya Birla Group is an Indian multinational conglomerate with businesses across metals, cement, textiles, financial services and more.',
    hpcl: 'Hindustan Petroleum Corporation Limited is an Indian public sector oil and gas company.',
    'hpcl psu': 'Hindustan Petroleum Corporation Limited is an Indian public sector oil and gas company.',
    'physics wallah': 'Physics Wallah is an Indian education technology company offering online and offline learning programs.',
    pw: 'Physics Wallah is an Indian education technology company offering online and offline learning programs.',
    'physics wallah': 'Physics Wallah is an Indian education technology company offering online and offline learning programs.',
    epam: 'EPAM Systems is a global digital engineering and software development services company.',
    bel: 'Bharat Electronics Limited is an Indian public sector aerospace and defence electronics company.',
    'c dac': 'C-DAC is an Indian government research and development organisation focused on advanced computing and IT solutions.',
    'c dac chennai': 'C-DAC Chennai is a centre of C-DAC focused on advanced computing, software and electronics research and development.',
    sigmoid: 'Sigmoid is a data engineering and AI solutions company helping enterprises build analytics and decision systems.',
    infineon: 'Infineon Technologies is a semiconductor company providing products for automotive, industrial, power and security applications.',
    acmegrade: 'Acmegrade is an education technology platform offering training, upskilling and career-oriented learning programs.',
    'epack prefab': 'EPACK Prefab provides prefabricated construction and building infrastructure solutions.',
    'epam systems': 'EPAM Systems is a global digital engineering and software development services company.',
    'hero steels': 'Hero Steels is an Indian steel manufacturing company producing steel products for industrial use.',
    'mahindra afs': 'Mahindra AFS is part of Mahindra and Mahindra focused on automotive and farm equipment businesses.',
    'samsung r and d': 'Samsung R&D works on research and development for Samsung products, software and technology platforms.',
    hyundai: 'Hyundai is a global automotive manufacturer with engineering, manufacturing and mobility businesses.',
    delhivery: 'Delhivery is an Indian logistics and supply chain services company.',
    'ril': 'Reliance Industries Limited is an Indian conglomerate with businesses across energy, petrochemicals, retail, telecom and digital services.',
    'amazon': 'Amazon is a global technology and commerce company operating e-commerce, cloud computing, logistics and digital services.',
    'microsoft': 'Microsoft is a global technology company known for software, cloud services, devices and enterprise platforms.',
    'google': 'Google is a global technology company focused on search, advertising, cloud computing, software and consumer internet products.'
  };

  if (known[key]) return known[key];

  const branchText = branches.length ? branches.join(', ') : 'campus placement';
  const roleText = roles.length ? ` Roles seen: ${roles.slice(0, 4).join(', ')}.` : '';
  return `${name} is a recruiting organisation listed in the Placement Eligibility Sheet 2026 for ${branchText}.${roleText}`;
};

const roleSkills = (role, companyName) => {
  const text = `${role} ${companyName}`.toLowerCase();
  if (/sde|software|developer|programmer|engineer|project engineer|css/.test(text)) {
    return ['Programming', 'Data Structures', 'Problem Solving', 'Software Engineering'];
  }
  if (/data|analyst|analytics/.test(text)) {
    return ['Data Analysis', 'SQL', 'Problem Solving', 'Excel'];
  }
  if (/bda|business|sales|dm-2/.test(text)) {
    return ['Communication', 'Sales', 'Business Development', 'Presentation'];
  }
  if (/get|graduate engineer|engineer|probationary|officer|e-2|e01/.test(text)) {
    return ['Engineering Fundamentals', 'Problem Solving', 'Technical Aptitude', 'Communication'];
  }
  if (/faculty|gtf|teacher|education/.test(text)) {
    return ['Subject Knowledge', 'Teaching', 'Communication', 'Mentoring'];
  }
  if (/r&d|research/.test(text)) {
    return ['Research', 'Technical Documentation', 'Problem Solving', 'Engineering Fundamentals'];
  }
  return ['Problem Solving', 'Communication', 'Technical Aptitude'];
};

const jobDescription = (company, role, jobType, branches, minCgpa) => {
  const cleanRole = role || 'Campus Hire';
  return `${company} is hiring for the ${cleanRole} role through the 2026 campus placement process. This posting is open to ${branches.join(', ')} students with minimum CGPA ${minCgpa}. Responsibilities and selection expectations are inferred from the company, role and offer data in the placement sheet.`;
};

const parseSalary = (salary, offerType) => {
  const text = upper(`${salary} ${offerType}`);
  const numbers = [...text.matchAll(/\d+(\.\d+)?/g)].map((match) => Number(match[0]));
  const max = numbers.length ? Math.max(...numbers) : null;

  if (!max) return { stipendAmount: '', ppoAmount: '', ctcAmount: '' };
  if (/K\s*(PM|\/M|PER MONTH)|KPM|STIPEND/.test(text)) {
    return { stipendAmount: Math.round(max * 1000), ppoAmount: '', ctcAmount: '' };
  }
  if (/LPA|CTC|FTE|GET|AEH|SDE|DSE|L1|DM-2|OFFICER|ENGINEER|FACULTY/.test(text) || max < 100) {
    return { stipendAmount: '', ppoAmount: '', ctcAmount: Math.round(max * 100000) };
  }
  return { stipendAmount: '', ppoAmount: '', ctcAmount: Math.round(max) };
};

const inferJobType = (offerType, salaryInfo) => {
  const text = upper(offerType);
  if (text.includes('INTERN') && text.includes('PPO')) return 'INTERN_PPO';
  if (text.includes('INTERN') && text.includes('FTE')) return 'INTERN_FTE';
  if (text.includes('INTERN')) return 'INTERN_ONLY';
  if (text.includes('FTE')) return 'FTE_ONLY';
  if (salaryInfo.stipendAmount && salaryInfo.ctcAmount) return 'INTERN_FTE';
  if (salaryInfo.stipendAmount && !salaryInfo.ctcAmount) return 'INTERN_ONLY';
  return 'FTE_ONLY';
};

const sheetRows = (workbook, sheetName) => XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
  header: 1,
  defval: null,
  blankrows: false,
  raw: true
});

const branchSheetNames = (workbook) => workbook.SheetNames
  .filter((sheetName) => !['Color Coded', 'Stats', 'Form Responses 1'].includes(sheetName));

const bestEmailColumn = (rows, dataStart) => {
  let best = -1;
  let bestCount = 0;
  const maxCols = Math.max(...rows.map((row) => row.length));

  for (let col = 0; col < Math.min(4, maxCols); col += 1) {
    let count = 0;
    for (let row = dataStart; row < rows.length; row += 1) {
      if (validEmail(rows[row][col])) count += 1;
    }
    if (count > bestCount) {
      bestCount = count;
      best = col;
    }
  }

  return best;
};

const buildBranchStudentLookup = (workbook) => {
  const byEmail = new Map();
  const byNameAndBranch = new Map();

  for (const sheetName of branchSheetNames(workbook)) {
    const rows = sheetRows(workbook, sheetName);
    const headerRow = findHeaderRow(rows);
    if (headerRow < 0) continue;

    const hasSubHeader = isSubHeader(rows[headerRow + 1]);
    const dataStart = headerRow + (hasSubHeader ? 2 : 1);
    const headers = (rows[headerRow] || []).map(norm);
    let emailCol = findCol(headers, ['email']);
    if (emailCol < 0) emailCol = bestEmailColumn(rows, dataStart);

    const nameCol = findCol(headers, ['name']);
    const enrollmentCol = findCol(headers, ['enrol', 'enroll']);
    const sheetBranch = branchName(sheetName);

    rows.slice(dataStart).forEach((row) => {
      if (!row || row.every((value) => norm(value) === '')) return;

      const enrollmentNumber = upper(row[enrollmentCol]);
      const email = lower(row[emailCol]);
      const name = canonicalKey(row[nameCol]);
      if (!enrollmentNumber) return;

      if (validInstituteEmail(email)) {
        byEmail.set(email, { enrollmentNumber, branch: sheetBranch });
      }
      if (name) {
        byNameAndBranch.set(`${name}|${canonicalKey(sheetBranch)}`, { enrollmentNumber, branch: sheetBranch });
      }
    });
  }

  return { byEmail, byNameAndBranch };
};

const ensureDir = () => fs.mkdirSync(OUT_DIR, { recursive: true });

async function main() {
  ensureDir();

  const workbook = XLSX.readFile(WORKBOOK_PATH, { cellDates: false });
  const branchStudentLookup = buildBranchStudentLookup(workbook);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const formRows = sheetRows(workbook, 'Form Responses 1');
  const formHeaders = formRows[0].map(norm);
  const formCol = (patterns) => formHeaders.findIndex((header) => patterns.some((pattern) => lower(header).includes(pattern)));
  const formIndex = {
    timestamp: formCol(['timestamp']),
    responseEmail: formCol(['email address']),
    name: formCol(['name']),
    enrollment: formCol(['enrolment', 'enrollment']),
    branch: formCol(['branch']),
    instituteEmail: formCol(['institue email', 'institute email']),
    alternateEmail: formCol(['alternate email']),
    mobile: formCol(['contact number']),
    gender: formCol(['gender']),
    category: formCol(['category']),
    pwd: formCol(['disability']),
    cgpa5: formHeaders.findIndex((header) => lower(header).includes('5th semester') && lower(header).includes('cgpa')),
    reportCardUrl: formCol(['marksheet'])
  };

  const latestByEnrollment = new Map();
  const skippedUsers = [];

  formRows.slice(1).forEach((row, offset) => {
    const rowNumber = offset + 2;
    if (!row || row.every((value) => norm(value) === '')) return;

    const instituteEmail = lower(row[formIndex.instituteEmail]);
    const formBranch = norm(row[formIndex.branch]);
    const formName = norm(row[formIndex.name]);
    const branchMatch = branchStudentLookup.byEmail.get(instituteEmail)
      || branchStudentLookup.byNameAndBranch.get(`${canonicalKey(formName)}|${canonicalKey(formBranch)}`);
    const enrollment = branchMatch?.enrollmentNumber || upper(row[formIndex.enrollment]);
    const timestamp = parseNumber(row[formIndex.timestamp]) || rowNumber;

    if (!enrollment) {
      skippedUsers.push({ rowNumber, enrollmentNumber: '', email: instituteEmail, reason: 'missing_enrollment_number' });
      return;
    }

    const candidate = { row, rowNumber, timestamp };
    const existing = latestByEnrollment.get(enrollment);
    if (!existing || timestamp >= existing.timestamp) {
      if (existing) {
        skippedUsers.push({
          rowNumber: existing.rowNumber,
          enrollmentNumber: enrollment,
          email: lower(existing.row[formIndex.instituteEmail]),
          reason: 'older_duplicate_enrollment'
        });
      }
      latestByEnrollment.set(enrollment, candidate);
    } else {
      skippedUsers.push({ rowNumber, enrollmentNumber: enrollment, email: instituteEmail, reason: 'older_duplicate_enrollment' });
    }
  });

  const userCandidates = [...latestByEnrollment.entries()]
    .map(([enrollment, candidate]) => ({ enrollment, ...candidate }))
    .sort((a, b) => a.enrollment.localeCompare(b.enrollment));

  const latestByInstituteEmail = new Map();
  userCandidates.forEach((candidate) => {
    const instituteEmail = lower(candidate.row[formIndex.instituteEmail]);
    if (!validInstituteEmail(instituteEmail)) {
      skippedUsers.push({
        rowNumber: candidate.rowNumber,
        enrollmentNumber: candidate.enrollment,
        email: instituteEmail,
        reason: instituteEmail ? 'invalid_institute_email' : 'missing_institute_email'
      });
      return;
    }

    const existing = latestByInstituteEmail.get(instituteEmail);
    if (!existing || candidate.timestamp >= existing.timestamp) {
      if (existing) {
        skippedUsers.push({
          rowNumber: existing.rowNumber,
          enrollmentNumber: existing.enrollment,
          email: instituteEmail,
          reason: 'older_duplicate_institute_email'
        });
      }
      latestByInstituteEmail.set(instituteEmail, candidate);
    } else {
      skippedUsers.push({
        rowNumber: candidate.rowNumber,
        enrollmentNumber: candidate.enrollment,
        email: instituteEmail,
        reason: 'older_duplicate_institute_email'
      });
    }
  });

  const usersByEnrollment = new Map();
  const personalEmailSeen = new Set();
  const users = [...latestByInstituteEmail.entries()]
    .map(([, candidate], index) => {
      const row = candidate.row;
      const id = USER_ID_START + index;
      const alternateEmail = lower(row[formIndex.alternateEmail]);
      const personalEmail = validEmail(alternateEmail) && !personalEmailSeen.has(alternateEmail)
        ? alternateEmail
        : '';
      if (personalEmail) personalEmailSeen.add(personalEmail);

      const reportCardUrl = validUrl(row[formIndex.reportCardUrl])
        ? norm(row[formIndex.reportCardUrl])
        : PLACEHOLDER_PDF;

      const user = {
        id,
        email: lower(row[formIndex.instituteEmail]),
        password: passwordHash,
        role: 'STUDENT',
        name: norm(row[formIndex.name]),
        enrollmentNumber: candidate.enrollment,
        branch: branchStudentLookup.byEmail.get(lower(row[formIndex.instituteEmail]))?.branch || normalizeBranchName(row[formIndex.branch]),
        cgpa: '',
        skills: '',
        resumeUrl: PLACEHOLDER_PDF,
        reportCardUrl,
        mobile: parseMobile(row[formIndex.mobile]),
        category: parseCategory(row[formIndex.category], row[formIndex.pwd]),
        categoryCertificateUrl: '',
        domicileUrl: '',
        personalEmail,
        gender: parseGender(row[formIndex.gender]),
        createdAt: NOW,
        updatedAt: NOW
      };
      usersByEnrollment.set(user.enrollmentNumber, user);
      return user;
    });

  const companyMap = new Map();
  const jobMap = new Map();
  const skippedApplications = [];
  const skippedJobs = [];
  const branchSheets = branchSheetNames(workbook);

  const getCompany = (name) => {
    const displayName = canonicalCompanyName(name);
    const key = canonicalKey(displayName);
    if (!companyMap.has(key)) {
      companyMap.set(key, {
        id: COMPANY_ID_START + companyMap.size,
        name: displayName,
        branches: new Set(),
        roles: new Set(),
        mentions: 0
      });
    }
    return companyMap.get(key);
  };

  for (const sheetName of branchSheets) {
    const rows = sheetRows(workbook, sheetName);
    const headerRow = findHeaderRow(rows);
    if (headerRow < 0) continue;

    const hasSubHeader = isSubHeader(rows[headerRow + 1]);
    const dataStart = headerRow + (hasSubHeader ? 2 : 1);
    const top = rows[headerRow] || [];
    const sub = hasSubHeader ? rows[headerRow + 1] : rows[headerRow];
    const headers = top.map(norm);
    const sheetBranch = branchName(sheetName);

    const nameCol = findCol(headers, ['name']);
    const enrollmentCol = findCol(headers, ['enrol', 'enroll']);
    const cgpaCols = headers.map((header, index) => lower(header).includes('cgpa') ? index : -1).filter((index) => index >= 0);
    const cgpaCol = cgpaCols.find((index) => lower(headers[index]).includes('6')) ?? cgpaCols[cgpaCols.length - 1] ?? -1;

    const topFill = [];
    let group = '';
    for (let col = 0; col < Math.max(top.length, sub.length); col += 1) {
      if (norm(top[col])) group = norm(top[col]);
      topFill[col] = group;
    }

    const offerColumns = [];
    for (let col = 0; col < Math.max(top.length, sub.length); col += 1) {
      const label = upper(sub[col]);
      const topLabel = upper(top[col]);
      if (/^COMPANY(\s*\d+)?$/.test(label) || label === 'COMPANY NAME' || /^COMPANY\s*\d+$/.test(topLabel)) {
        let roleCol = null;
        let baseCol = null;
        let ctcCol = null;
        let offerTypeCol = null;

        for (let lookahead = col + 1; lookahead <= Math.min(col + 6, Math.max(top.length, sub.length) - 1); lookahead += 1) {
          const nextLabel = upper(sub[lookahead] || top[lookahead]);
          if (roleCol === null && nextLabel === 'ROLE') roleCol = lookahead;
          if (offerTypeCol === null && nextLabel.includes('OFFER TYPE')) offerTypeCol = lookahead;
          if (baseCol === null && (nextLabel.includes('BASE PAY') || nextLabel.includes('STIPEND') || nextLabel === 'PACKAGE')) baseCol = lookahead;
          if (ctcCol === null && (nextLabel === 'CTC' || nextLabel === 'PACKAGE')) ctcCol = lookahead;
        }

        const isUnderProcessing = upper(topFill[col]).includes('UNDER');
        offerColumns.push({ companyCol: col, roleCol, baseCol, ctcCol, offerTypeCol, isUnderProcessing });
      }
    }

    rows.slice(dataStart).forEach((row, offset) => {
      const rowNumber = dataStart + offset + 1;
      if (!row || row.every((value) => norm(value) === '')) return;

      const enrollment = upper(row[enrollmentCol]);
      const studentName = norm(row[nameCol]);
      if (!enrollment && !studentName) return;

      const student = usersByEnrollment.get(enrollment);
      const cgpa = parseNumber(row[cgpaCol]);
      if (student && cgpa !== null && cgpa >= 0 && cgpa <= 10) {
        student.cgpa = String(Number(cgpa.toFixed(3)));
      }

      offerColumns.forEach((offer) => {
        const companyName = cleanCompanyName(row[offer.companyCol]);
        if (!companyName) return;

        const company = getCompany(companyName);
        company.mentions += 1;
        company.branches.add(sheetBranch);

        if (offer.isUnderProcessing) return;

        const role = norm(row[offer.roleCol]) || 'Campus Hire';
        const basePay = norm(row[offer.baseCol]);
        const ctc = norm(row[offer.ctcCol]);
        const salaryText = ctc || basePay;
        const offerType = norm(row[offer.offerTypeCol]);
        company.roles.add(role);

        if (!student) {
          skippedApplications.push({
            sheetName,
            rowNumber,
            enrollmentNumber: enrollment,
            company: companyName,
            role,
            reason: 'student_not_in_user_csv'
          });
          return;
        }

        const salaryInfo = parseSalary(salaryText, offerType);
        const jobType = inferJobType(offerType, salaryInfo);
        const title = `${role} - ${company.name}`;
        const key = [
          canonicalKey(company.name),
          canonicalKey(role),
          canonicalKey(salaryText),
          canonicalKey(offerType)
        ].join('|');

        if (!jobMap.has(key)) {
          jobMap.set(key, {
            id: JOB_ID_START + jobMap.size,
            title,
            company,
            role,
            salaryText,
            offerType,
            jobType,
            salaryInfo,
            branches: new Set(),
            cgpas: [],
            students: new Map()
          });
        }

        const job = jobMap.get(key);
        job.branches.add(sheetBranch);
        if (cgpa !== null && cgpa >= 0 && cgpa <= 10) job.cgpas.push(cgpa);
        job.students.set(student.id, {
          studentId: student.id,
          enrollmentNumber: student.enrollmentNumber,
          studentName: student.name,
          sourceSheet: sheetName,
          sourceRow: rowNumber
        });
      });
    });
  }

  users.forEach((user) => {
    if (user.cgpa === '') {
      const latest = latestByEnrollment.get(user.enrollmentNumber);
      const cgpa5 = parseNumber(latest?.row?.[formIndex.cgpa5]);
      if (cgpa5 !== null && cgpa5 >= 0 && cgpa5 <= 10) user.cgpa = String(Number(cgpa5.toFixed(3)));
    }
  });

  const companies = [...companyMap.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((company, index) => {
      company.id = COMPANY_ID_START + index;
      return {
        id: company.id,
        name: company.name,
        description: companyDescription(company.name, [...company.branches].sort(), [...company.roles].sort()),
        assignedCRC: '',
        createdAt: NOW,
        updatedAt: NOW
      };
    });

  const companyIdByKey = new Map([...companyMap.values()].map((company) => [canonicalKey(company.name), company.id]));

  const jobs = [...jobMap.values()]
    .sort((a, b) => a.company.name.localeCompare(b.company.name) || a.title.localeCompare(b.title))
    .map((job, index) => {
      job.id = JOB_ID_START + index;
      const branches = [...job.branches].sort();
      const minCgpa = job.cgpas.length
        ? Number(Math.min(...job.cgpas).toFixed(3))
        : 0;

      if (!job.cgpas.length) {
        skippedJobs.push({
          company: job.company.name,
          role: job.role,
          salary: job.salaryText,
          reason: 'min_cgpa_defaulted_to_zero_no_valid_student_cgpa'
        });
      }

      return {
        id: job.id,
        title: job.title,
        companyId: companyIdByKey.get(canonicalKey(job.company.name)),
        description: jobDescription(job.company.name, job.role, job.jobType, branches, minCgpa),
        minCgpa,
        requiredSkills: pgArray(roleSkills(job.role, job.company.name)),
        eligibleBranches: pgArray(branches),
        status: 'OPEN',
        jobType: job.jobType,
        stipendAmount: job.salaryInfo.stipendAmount,
        ppoAmount: job.salaryInfo.ppoAmount,
        ctcAmount: job.salaryInfo.ctcAmount,
        createdAt: NOW,
        updatedAt: NOW
      };
    });

  const applications = [];
  [...jobMap.values()].forEach((job) => {
    [...job.students.values()].forEach((student) => {
      applications.push({
        id: APPLICATION_ID_START + applications.length,
        studentId: student.studentId,
        jobId: job.id,
        status: 'SELECTED',
        createdAt: NOW,
        updatedAt: NOW
      });
    });
  });

  writeCsv('users.csv', [
    'id',
    'email',
    'password',
    'role',
    'name',
    'enrollmentNumber',
    'branch',
    'cgpa',
    'skills',
    'resumeUrl',
    'reportCardUrl',
    'mobile',
    'category',
    'categoryCertificateUrl',
    'domicileUrl',
    'personalEmail',
    'gender',
    'createdAt',
    'updatedAt'
  ], users);

  writeCsv('companies.csv', [
    'id',
    'name',
    'description',
    'assignedCRC',
    'createdAt',
    'updatedAt'
  ], companies);

  writeCsv('jobs.csv', [
    'id',
    'title',
    'companyId',
    'description',
    'minCgpa',
    'requiredSkills',
    'eligibleBranches',
    'status',
    'jobType',
    'stipendAmount',
    'ppoAmount',
    'ctcAmount',
    'createdAt',
    'updatedAt'
  ], jobs);

  writeCsv('applications.csv', [
    'id',
    'studentId',
    'jobId',
    'status',
    'createdAt',
    'updatedAt'
  ], applications);

  writeCsv('otp.csv', [
    'id',
    'email',
    'otpHash',
    'expiry',
    'attempts',
    'used',
    'createdAt'
  ], []);

  writeCsv('skipped_users.csv', [
    'rowNumber',
    'enrollmentNumber',
    'email',
    'reason'
  ], skippedUsers);

  writeCsv('skipped_applications.csv', [
    'sheetName',
    'rowNumber',
    'enrollmentNumber',
    'company',
    'role',
    'reason'
  ], skippedApplications);

  writeCsv('job_generation_notes.csv', [
    'company',
    'role',
    'salary',
    'reason'
  ], skippedJobs);

  writeCsv('import_summary.csv', [
    'metric',
    'value'
  ], [
    { metric: 'users', value: users.length },
    { metric: 'companies', value: companies.length },
    { metric: 'jobs', value: jobs.length },
    { metric: 'applications', value: applications.length },
    { metric: 'skipped_users', value: skippedUsers.length },
    { metric: 'skipped_applications', value: skippedApplications.length },
    { metric: 'default_password_plaintext', value: DEFAULT_PASSWORD },
    { metric: 'placeholder_pdf', value: PLACEHOLDER_PDF },
    { metric: 'invalid_email_rule', value: 'must match email format and end with @nitsri.ac.in' }
  ]);

  console.log(JSON.stringify({
    outDir: OUT_DIR,
    users: users.length,
    companies: companies.length,
    jobs: jobs.length,
    applications: applications.length,
    skippedUsers: skippedUsers.length,
    skippedApplications: skippedApplications.length,
    placeholderPdf: PLACEHOLDER_PDF,
    defaultPassword: DEFAULT_PASSWORD
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
