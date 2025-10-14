const request = require('supertest');
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const schema = require('../graphql/schema');
const prisma = require('../config/prismaClient');

let app;

beforeAll(async () => {
  // Start Apollo Server
  const server = new ApolloServer({ schema });
  await server.start();

  app = express();
  app.use(bodyParser.json());
  app.use('/graphql', expressMiddleware(server));
});

describe('Student GraphQL', () => {
  let studentId;
  let token;
  let email;
  let enrollmentNumber;

  // Before all tests in this suite, generate unique email/enrollment
  beforeAll(() => {
    const random = Date.now();
    email = `john${random}@nitsri.ac.in`;
    enrollmentNumber = `EN${random}`;
  });

  it('registers a student', async () => {
    const mutation = `
      mutation {
        registerStudent(
          name: "John Doe",
          enrollmentNumber: "${enrollmentNumber}",
          email: "${email}",
          password: "password123",
          department: "CSE",
          batch: 2025,
          tenthMarksheet: "/files/10th.pdf",
          twelfthMarksheet: "/files/12th.pdf",
          resume: "/files/resume.pdf",
          profilePicture: "/files/profile.jpg"
        ) {
          token
          student {
            id
            name
            email
            isActivated
          }
        }
      }
    `;

    const res = await request(app)
      .post('/graphql')
      .send({ query: mutation });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.registerStudent.student.name).toBe("John Doe");
    expect(res.body.data.registerStudent.student.isActivated).toBe(false);

    studentId = res.body.data.registerStudent.student.id;
    token = res.body.data.registerStudent.token;
  });

  it('logs in the student', async () => {
    const mutation = `
      mutation {
        loginStudent(email: "${email}", password: "password123") {
          token
          student {
            id
            name
          }
        }
      }
    `;

    const res = await request(app)
      .post('/graphql')
      .send({ query: mutation });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.loginStudent.student.name).toBe("John Doe");
  });

  it('fetches students', async () => {
    const query = `
      query {
        students {
          id
          name
          email
        }
      }
    `;
    const res = await request(app)
      .post('/graphql')
      .send({ query });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.students.length).toBeGreaterThan(0);
  });

  it('activates a student', async () => {
    const mutation = `
      mutation {
        activateStudent(id: ${studentId}) {
          id
          isActivated
        }
      }
    `;
    const res = await request(app)
      .post('/graphql')
      .send({ query: mutation });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.activateStudent.isActivated).toBe(true);
  });

  // Cleanup: delete only the student created in this test
  afterAll(async () => {
    if (studentId) {
      await prisma.student.delete({ where: { id: parseInt(studentId, 10) } });
    }
    await prisma.$disconnect();
  });

});
