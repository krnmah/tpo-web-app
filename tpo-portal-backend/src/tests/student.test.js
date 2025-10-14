const request = require('supertest');
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const schema = require('../graphql/schema');

let app;

beforeAll(async () => {
  const server = new ApolloServer({ schema });
  await server.start();

  app = express();
  app.use(bodyParser.json());
  app.use('/graphql', expressMiddleware(server));
});

describe('Student GraphQL', () => {
  let studentId;
  let token;

  it('registers a student', async () => {
    const mutation = `
      mutation {
        registerStudent(
          name: "John Doe",
          enrollmentNumber: "EN12345",
          email: "john@college.edu",
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
        loginStudent(email: "john@college.edu", password: "password123") {
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
});
