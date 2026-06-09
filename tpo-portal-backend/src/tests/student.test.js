const request = require('supertest');
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const schema = require('../graphql/schema');
const prisma = require('../config/prismaClient');
const { buildContext } = require('../middleware/auth');
const { generateToken, hashPassword } = require('../utils/auth');

let app;

beforeAll(async () => {
  const server = new ApolloServer({ schema });
  await server.start();

  app = express();
  app.use(bodyParser.json());
  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => buildContext(req)
  }));
});

function registerStudentMutation(data) {
  return `
    mutation {
      registerStudent(
        name: "${data.name}"
        enrollmentNumber: "${data.enrollmentNumber}"
        branch: "${data.branch || 'Computer Science and Engineering'}"
        email: "${data.email}"
        password: "${data.password || 'Password@123'}"
        cgpa: ${data.cgpa ?? 8.5}
        skills: ${JSON.stringify(data.skills || ['JavaScript', 'React'])}
        resumeUrl: "${data.resumeUrl || 'https://example.com/resume.pdf'}"
        reportCardUrl: "${data.reportCardUrl || 'https://example.com/report-card.pdf'}"
        mobile: "${data.mobile || '9876543210'}"
        category: ${data.category || 'GENERAL'}
        categoryCertificateUrl: ${data.categoryCertificateUrl ? `"${data.categoryCertificateUrl}"` : null}
        domicileUrl: ${data.domicileUrl ? `"${data.domicileUrl}"` : null}
        personalEmail: "${data.personalEmail}"
        gender: ${data.gender || 'MALE'}
      ) {
        token
        user {
          id
          name
          email
          role
          cgpa
        }
      }
    }
  `;
}

describe('Authentication Tests', () => {
  let studentId;
  let token;
  let email;
  let enrollmentNumber;

  beforeAll(() => {
    const random = Date.now();
    email = `john${random}@nitsri.ac.in`;
    enrollmentNumber = `EN${random}`;
  });

  it('registers a student with valid data', async () => {
    const mutation = registerStudentMutation({
      name: 'John Doe',
      enrollmentNumber,
      email,
      personalEmail: `john.personal${Date.now()}@example.com`
    });

    const res = await request(app)
      .post('/graphql')
      .send({ query: mutation });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.registerStudent.user.name).toBe("John Doe");
    expect(res.body.data.registerStudent.user.role).toBe("STUDENT");
    expect(res.body.data.registerStudent.user.cgpa).toBe(8.5);
    expect(res.body.data.registerStudent.token).toBeTruthy();

    studentId = res.body.data.registerStudent.user.id;
    token = res.body.data.registerStudent.token;
  });

  it('rejects registration with invalid email domain', async () => {
    const mutation = `
      mutation {
        registerStudent(
          name: "Jane Doe"
          enrollmentNumber: "EN99999"
          branch: "Computer Science and Engineering"
          email: "jane@gmail.com"
          password: "Password@123"
          cgpa: 8.0
          skills: ["Python"]
          resumeUrl: "https://example.com/resume.pdf"
          reportCardUrl: "https://example.com/report-card.pdf"
          mobile: "9876543211"
          category: GENERAL
          personalEmail: "jane.personal@example.com"
          gender: FEMALE
        ) {
          token
          user {
            id
          }
        }
      }
    `;

    const res = await request(app)
      .post('/graphql')
      .send({ query: mutation });

    expect(res.statusCode).toBe(200);
    expect(res.body.errors).toBeTruthy();
    expect(res.body.errors[0].message).toContain("@nitsri.ac.in");
  });

  it('logs in with valid credentials', async () => {
    const mutation = `
      mutation {
        login(email: "${email}", password: "Password@123") {
          token
          user {
            id
            name
            email
          }
        }
      }
    `;

    const res = await request(app)
      .post('/graphql')
      .send({ query: mutation });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.login.user.name).toBe("John Doe");
    expect(res.body.data.login.token).toBeTruthy();
  });

  it('rejects login with invalid password', async () => {
    const mutation = `
      mutation {
        login(email: "${email}", password: "wrongpassword") {
          token
          user {
            id
          }
        }
      }
    `;

    const res = await request(app)
      .post('/graphql')
      .send({ query: mutation });

    expect(res.statusCode).toBe(200);
    expect(res.body.errors).toBeTruthy();
    expect(res.body.errors[0].message).toContain("Invalid");
  });

  afterAll(async () => {
    // Cleanup
    if (studentId) {
      await prisma.user.delete({ where: { id: parseInt(studentId, 10) } });
    }
    await prisma.$disconnect();
  });
});

describe('Job Application Tests', () => {
  let studentId;
  let companyId;
  let jobId;
  let token;
  let email;

  beforeAll(async () => {
    const random = Date.now();
    email = `student${random}@nitsri.ac.in`;

    // Register a student
    const registerMutation = `
      mutation {
        registerStudent(
          name: "Test Student"
          enrollmentNumber: "TS${random}"
          branch: "Computer Science and Engineering"
          email: "${email}"
          password: "Password@123"
          cgpa: 8.0
          skills: ["JavaScript"]
          resumeUrl: "https://example.com/resume.pdf"
          reportCardUrl: "https://example.com/report-card.pdf"
          mobile: "9876543212"
          category: GENERAL
          personalEmail: "test.personal${random}@example.com"
          gender: MALE
        ) {
          token
          user {
            id
          }
        }
      }
    `;

    const registerRes = await request(app)
      .post('/graphql')
      .send({ query: registerMutation });

    studentId = registerRes.body.data.registerStudent.user.id;
    token = registerRes.body.data.registerStudent.token;

    // Create a company (we'll do this directly via Prisma since it requires admin role)
    const company = await prisma.company.create({
      data: {
        name: "Test Company",
        description: "A test company"
      }
    });
    companyId = company.id;

    // Create a job
    const job = await prisma.job.create({
      data: {
        title: "Software Engineer",
        companyId: companyId,
        description: "Software engineer role for backend and frontend development.",
        minCgpa: 7.5,
        requiredSkills: ["JavaScript"],
        status: "OPEN"
      }
    });
    jobId = job.id;
  });

  it('allows eligible student to apply for job', async () => {
    const mutation = `
      mutation {
        applyForJob(jobId: ${jobId}) {
          id
          status
          student {
            id
            name
          }
          job {
            id
            title
          }
        }
      }
    `;

    const res = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: mutation });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.applyForJob.status).toBe("APPLIED");
    expect(res.body.data.applyForJob.job.title).toBe("Software Engineer");
  });

  it('prevents duplicate applications', async () => {
    const mutation = `
      mutation {
        applyForJob(jobId: ${jobId}) {
          id
          status
        }
      }
    `;

    const res = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: mutation });

    expect(res.statusCode).toBe(200);
    expect(res.body.errors).toBeTruthy();
    expect(res.body.errors[0].message).toContain("already applied");
  });

  it('prevents application when CGPA is too low', async () => {
    // Create a job with higher CGPA requirement
    const highCgpaJob = await prisma.job.create({
      data: {
        title: "Senior Engineer",
        companyId: companyId,
        description: "Senior engineer role requiring strong software fundamentals.",
        minCgpa: 9.0,
        requiredSkills: ["JavaScript"],
        status: "OPEN"
      }
    });

    const mutation = `
      mutation {
        applyForJob(jobId: ${highCgpaJob.id}) {
          id
          status
        }
      }
    `;

    const res = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: mutation });

    expect(res.statusCode).toBe(200);
    expect(res.body.errors).toBeTruthy();
    expect(res.body.errors[0].message).toContain("not eligible");

    // Cleanup
    await prisma.job.delete({ where: { id: highCgpaJob.id } });
  });

  it('prevents application for closed jobs', async () => {
    const closedJob = await prisma.job.create({
      data: {
        title: "Closed Position",
        companyId: companyId,
        description: "Closed position used for application validation testing.",
        minCgpa: 7.0,
        requiredSkills: ["JavaScript"],
        status: "CLOSED"
      }
    });

    const mutation = `
      mutation {
        applyForJob(jobId: ${closedJob.id}) {
          id
          status
        }
      }
    `;

    const res = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: mutation });

    expect(res.statusCode).toBe(200);
    expect(res.body.errors).toBeTruthy();
    expect(res.body.errors[0].message).toContain("no longer accepting");

    // Cleanup
    await prisma.job.delete({ where: { id: closedJob.id } });
  });

  afterAll(async () => {
    // Cleanup in order
    await prisma.application.deleteMany({
      where: {
        OR: [
          { studentId: parseInt(studentId) },
          { job: { companyId } }
        ]
      }
    });
    await prisma.job.deleteMany({ where: { companyId } });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.user.delete({ where: { id: parseInt(studentId) } });
    await prisma.$disconnect();
  });
});

describe('Access Control Tests', () => {
  let adminToken;
  let studentToken;
  let adminId;
  let studentId;

  beforeAll(async () => {
    // Create admin
    const admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: `admin${Date.now()}@nitsri.ac.in`,
        password: await hashPassword("Admin@123"),
        role: "ADMIN",
        cgpa: 0,
        skills: []
      }
    });
    adminId = admin.id;
    adminToken = generateToken(admin);

    // Create student
    const student = await prisma.user.create({
      data: {
        name: "Test Student",
        email: `student${Date.now()}@nitsri.ac.in`,
        password: await hashPassword("Student@123"),
        role: "STUDENT",
        cgpa: 8.0,
        skills: ["Test"]
      }
    });
    studentId = student.id;
    studentToken = generateToken(student);
  });

  it('allows admin to access all users', async () => {
    const query = `
      query {
        users {
          id
          name
          email
          role
        }
      }
    `;

    const res = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ query: query });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.users).toBeTruthy();
    expect(Array.isArray(res.body.data.users)).toBe(true);
  });

  it('denies student access to all users', async () => {
    const query = `
      query {
        users {
          id
          name
        }
      }
    `;

    const res = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ query: query });

    expect(res.statusCode).toBe(200);
    expect(res.body.errors).toBeTruthy();
    expect(res.body.errors[0].message).toContain("Forbidden");
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminId, studentId].filter(Boolean) }
      }
    });
    await prisma.$disconnect();
  });
});
