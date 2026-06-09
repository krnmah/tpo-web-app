const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/tnp_portal';
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const IMPORT_DIR = path.resolve(__dirname, '../prisma/imports/placement-2026');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function readCsv(filename) {
  const text = fs.readFileSync(path.join(IMPORT_DIR, filename), 'utf8');
  const [headers, ...rows] = parseCsv(text);

  return rows
    .filter((row) => row.some((value) => value !== ''))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
}

function parsePgArray(value) {
  const text = String(value || '').trim();
  if (!text || text === '{}') return [];

  const body = text.startsWith('{') && text.endsWith('}')
    ? text.slice(1, -1)
    : text;

  const items = [];
  let current = '';
  let inQuotes = false;
  let escaping = false;

  for (const char of body) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      if (current) items.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current) items.push(current);
  return items;
}

const nullable = (value) => {
  const text = String(value ?? '').trim();
  return text ? text : null;
};

const nullableNumber = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
};

const intValue = (value) => Number.parseInt(value, 10);
const dateValue = (value) => new Date(value);

function omitId(data) {
  const { id, ...rest } = data;
  return rest;
}

async function importUsers(rows) {
  let created = 0;
  let updated = 0;
  const skipped = [];
  const idMap = new Map();

  for (const row of rows) {
    const csvId = intValue(row.id);
    const data = {
      id: csvId,
      email: row.email,
      password: row.password,
      role: row.role,
      name: row.name,
      enrollmentNumber: nullable(row.enrollmentNumber),
      branch: nullable(row.branch),
      cgpa: nullableNumber(row.cgpa),
      skills: parsePgArray(row.skills),
      resumeUrl: nullable(row.resumeUrl),
      reportCardUrl: nullable(row.reportCardUrl),
      mobile: nullable(row.mobile),
      category: row.category || 'GENERAL',
      categoryCertificateUrl: nullable(row.categoryCertificateUrl),
      domicileUrl: nullable(row.domicileUrl),
      personalEmail: nullable(row.personalEmail),
      gender: nullable(row.gender),
      createdAt: dateValue(row.createdAt),
      updatedAt: dateValue(row.updatedAt)
    };

    const uniqueChecks = [
      { id: csvId },
      { email: data.email }
    ];
    if (data.enrollmentNumber) uniqueChecks.push({ enrollmentNumber: data.enrollmentNumber });
    if (data.personalEmail) uniqueChecks.push({ personalEmail: data.personalEmail });

    const matches = await prisma.user.findMany({ where: { OR: uniqueChecks } });
    const primaryMatches = matches.filter((match) => (
      match.id === csvId ||
      match.email === data.email ||
      (data.enrollmentNumber && match.enrollmentNumber === data.enrollmentNumber)
    ));
    const distinctIds = new Set(primaryMatches.map((match) => match.id));

    if (distinctIds.size > 1) {
      skipped.push({ id: csvId, email: data.email, reason: 'multiple_existing_user_matches' });
      continue;
    }

    const existing = primaryMatches[0];
    if (existing && existing.id === csvId && existing.email !== data.email && existing.enrollmentNumber !== data.enrollmentNumber) {
      skipped.push({ id: csvId, email: data.email, reason: 'unsafe_user_id_conflict' });
      continue;
    }

    if (existing) {
      const updatedUser = await prisma.user.update({
        where: { id: existing.id },
        data: omitId(data)
      });
      idMap.set(csvId, updatedUser.id);
      updated += 1;
      continue;
    }

    const createdUser = await prisma.user.create({ data });
    idMap.set(csvId, createdUser.id);
    created += 1;
  }

  return { created, updated, skipped, idMap };
}

async function importCompanies(rows) {
  let created = 0;
  let updated = 0;
  const idMap = new Map();

  for (const row of rows) {
    const csvId = intValue(row.id);
    const data = {
      id: csvId,
      name: row.name,
      description: row.description,
      assignedCRC: nullableNumber(row.assignedCRC),
      createdAt: dateValue(row.createdAt),
      updatedAt: dateValue(row.updatedAt)
    };

    const existing = await prisma.company.findUnique({ where: { id: csvId } });
    if (existing) {
      const company = await prisma.company.update({
        where: { id: csvId },
        data: omitId(data)
      });
      idMap.set(csvId, company.id);
      updated += 1;
    } else {
      const company = await prisma.company.create({ data });
      idMap.set(csvId, company.id);
      created += 1;
    }
  }

  return { created, updated, idMap };
}

async function importJobs(rows, companyIdMap) {
  let created = 0;
  let updated = 0;
  const skipped = [];
  const idMap = new Map();

  for (const row of rows) {
    const csvId = intValue(row.id);
    const companyId = companyIdMap.get(intValue(row.companyId));

    if (!companyId) {
      skipped.push({ id: csvId, title: row.title, reason: 'company_not_imported' });
      continue;
    }

    const data = {
      id: csvId,
      title: row.title,
      companyId,
      description: nullable(row.description),
      minCgpa: nullableNumber(row.minCgpa) ?? 0,
      requiredSkills: parsePgArray(row.requiredSkills),
      eligibleBranches: parsePgArray(row.eligibleBranches),
      status: row.status || 'OPEN',
      jobType: row.jobType || 'FTE_ONLY',
      stipendAmount: nullableNumber(row.stipendAmount),
      ppoAmount: nullableNumber(row.ppoAmount),
      ctcAmount: nullableNumber(row.ctcAmount),
      createdAt: dateValue(row.createdAt),
      updatedAt: dateValue(row.updatedAt)
    };

    const existing = await prisma.job.findUnique({ where: { id: csvId } });
    if (existing) {
      const job = await prisma.job.update({
        where: { id: csvId },
        data: omitId(data)
      });
      idMap.set(csvId, job.id);
      updated += 1;
    } else {
      const job = await prisma.job.create({ data });
      idMap.set(csvId, job.id);
      created += 1;
    }
  }

  return { created, updated, skipped, idMap };
}

async function importApplications(rows, userIdMap, jobIdMap) {
  let created = 0;
  let updated = 0;
  const skipped = [];

  for (const row of rows) {
    const csvId = intValue(row.id);
    const studentId = userIdMap.get(intValue(row.studentId));
    const jobId = jobIdMap.get(intValue(row.jobId));

    if (!studentId || !jobId) {
      skipped.push({ id: csvId, studentId: row.studentId, jobId: row.jobId, reason: 'student_or_job_not_imported' });
      continue;
    }

    const data = {
      id: csvId,
      studentId,
      jobId,
      status: row.status || 'SELECTED',
      createdAt: dateValue(row.createdAt),
      updatedAt: dateValue(row.updatedAt)
    };

    const existing = await prisma.application.findFirst({
      where: {
        OR: [
          { id: csvId },
          { studentId, jobId }
        ]
      }
    });

    if (existing) {
      await prisma.application.update({
        where: { id: existing.id },
        data: omitId(data)
      });
      updated += 1;
    } else {
      await prisma.application.create({ data });
      created += 1;
    }
  }

  return { created, updated, skipped };
}

async function syncSequences() {
  await prisma.$executeRawUnsafe('SELECT setval(pg_get_serial_sequence(\'"User"\', \'id\'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "User"), 1), true)');
  await prisma.$executeRawUnsafe('SELECT setval(pg_get_serial_sequence(\'"Company"\', \'id\'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Company"), 1), true)');
  await prisma.$executeRawUnsafe('SELECT setval(pg_get_serial_sequence(\'"Job"\', \'id\'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Job"), 1), true)');
  await prisma.$executeRawUnsafe('SELECT setval(pg_get_serial_sequence(\'"Application"\', \'id\'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "Application"), 1), true)');
}

async function verifyCounts() {
  const importedUsers = readCsv('users.csv');
  const importedUserIds = importedUsers.map((row) => intValue(row.id));
  const importedUserEmails = importedUsers.map((row) => row.email);
  const importedCompanyIds = readCsv('companies.csv').map((row) => intValue(row.id));
  const importedJobIds = readCsv('jobs.csv').map((row) => intValue(row.id));
  const importedApplicationIds = readCsv('applications.csv').map((row) => intValue(row.id));

  return {
    usersByCsvId: await prisma.user.count({ where: { id: { in: importedUserIds } } }),
    usersByCsvEmail: await prisma.user.count({ where: { email: { in: importedUserEmails } } }),
    companies: await prisma.company.count({ where: { id: { in: importedCompanyIds } } }),
    jobs: await prisma.job.count({ where: { id: { in: importedJobIds } } }),
    applications: await prisma.application.count({ where: { id: { in: importedApplicationIds } } })
  };
}

async function main() {
  const users = readCsv('users.csv');
  const companies = readCsv('companies.csv');
  const jobs = readCsv('jobs.csv');
  const applications = readCsv('applications.csv');

  console.log(`Using DATABASE_URL=${process.env.DATABASE_URL.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@')}`);
  console.log(`Importing ${users.length} users, ${companies.length} companies, ${jobs.length} jobs, ${applications.length} applications...`);

  const userResult = await importUsers(users);
  const companyResult = await importCompanies(companies);
  const jobResult = await importJobs(jobs, companyResult.idMap);
  const applicationResult = await importApplications(applications, userResult.idMap, jobResult.idMap);

  await syncSequences();

  const verified = await verifyCounts();

  console.log(JSON.stringify({
    users: {
      created: userResult.created,
      updated: userResult.updated,
      skipped: userResult.skipped.length
    },
    companies: {
      created: companyResult.created,
      updated: companyResult.updated
    },
    jobs: {
      created: jobResult.created,
      updated: jobResult.updated,
      skipped: jobResult.skipped.length
    },
    applications: {
      created: applicationResult.created,
      updated: applicationResult.updated,
      skipped: applicationResult.skipped.length
    },
    verifiedImportedRowsInDb: verified,
    skippedDetails: {
      users: userResult.skipped.slice(0, 10),
      jobs: jobResult.skipped.slice(0, 10),
      applications: applicationResult.skipped.slice(0, 10)
    }
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
