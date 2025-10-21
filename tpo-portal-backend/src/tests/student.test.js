const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mock only non-DB side effects
jest.mock('../utils/mailer', () => ({
  sendWelcomeEmail: jest.fn(() => Promise.resolve()),
}));

// Simplify uploads for tests: inject req.files from JSON
jest.mock('../middleware/upload', () => ({
  upload: {
    fields: jest.fn(() => {
      return (req, res, next) => {
        req.files = req.body && req.body.__files ? req.body.__files : {};
        next();
      };
    }),
  },
}));

const pdf = (name = 'file.pdf') => ({ originalname: name, mimetype: 'application/pdf' });
const img = (name = 'pic.jpg') => ({ originalname: name, mimetype: 'image/jpeg' });

const defaultFiles = () => ({
  tenthMarksheet: [pdf('tenth.pdf')],
  twelfthMarksheet: [pdf('twelfth.pdf')],
  resume: [pdf('resume.pdf')],
  semMarksheet: [pdf('sem.pdf')],
  profilePicture: [img('avatar.jpg')],
});

const validBody = (overrides = {}, fileOverrides = {}) => ({
  name: 'John Doe',
  email: 'john@example.com',
  enrollmentNumber: 'EN123',
  department: 'CSE',
  batch: '2025',
  cgpa: '8.5',
  twelfthPer: '85',
  tenthPer: '90',
  __files: { ...defaultFiles(), ...fileOverrides },
  ...overrides,
});

let mongod;
let app;
let TempUser;
let Student;
const { sendWelcomeEmail } = require('../utils/mailer');

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  // Import models and router AFTER connecting
  TempUser = require('../models/TempUser');
  Student = require('../models/Student');
  const studentRouter = require('../routes/student');

  app = express();
  app.use(express.json());
  app.use('/', studentRouter);
  // test error handler
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.clientMessage || 'Error' });
  });
}, 30000);

afterEach(async () => {
  // Clean DB between tests
  const collections = await mongoose.connection.db.collections();
  for (const c of collections) {
    await c.deleteMany({});
  }
  jest.clearAllMocks();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

describe('POST /complete-profile', () => {
  test('400 when token is missing', async () => {
    const res = await request(app).post('/complete-profile').send(validBody());
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Verification link is missing');
  });

  test('401 when token invalid or expired', async () => {
    const res = await request(app)
      .post('/complete-profile')
      .query({ token: 'bad-token' })
      .send(validBody());
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Verification link is invalid or has expired');
  });

  test('400 when required body fields are missing', async () => {
    await TempUser.create({ email: "john@example.com", name: "John Doe", token: 't1', passwordHash: 'hash' });
    const body = validBody({ enrollmentNumber: undefined });
    const res = await request(app)
      .post('/complete-profile')
      .query({ token: 't1' })
      .send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Please provide enrollment number, department, cgpa, percentage and batch');
  });

  test('400 when required files are missing', async () => {
    await TempUser.create({ email: "john@example.com", name: "John Doe", token: 't1', passwordHash: 'hash' });
    const res = await request(app)
      .post('/complete-profile')
      .query({ token: 't1' })
      .send(validBody({}, { resume: [] })); // explicitly missing one required file
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('All files (marksheets, resume, profile picture) are required');
  });

  test('400 when non-PDF provided for resume/marksheets', async () => {
    await TempUser.create({ email: "john@example.com", name: "John Doe", token: 't1', passwordHash: 'hash' });
    const files = defaultFiles();
    files.resume = [{ originalname: 'resume.txt', mimetype: 'text/plain' }];
    const res = await request(app)
      .post('/complete-profile')
      .query({ token: 't1' })
      .send(validBody({}, files));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Marksheet and resume must be PDF');
  });

  test('400 when profile picture is not an image', async () => {
    await TempUser.create({ email: "john@example.com", name: "John Doe", token: 't1', passwordHash: 'hash' });
    const files = defaultFiles();
    files.profilePicture = [{ originalname: 'avatar.pdf', mimetype: 'application/pdf' }];
    const res = await request(app)
      .post('/complete-profile')
      .query({ token: 't1' })
      .send(validBody({}, files));
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Profile picture must be an image');
  });

  test('400 when account with email already exists', async () => {
    await TempUser.create({ email: "john@example.com", name: "John Doe", token: 't1', passwordHash: 'hash' });
    // Insert existing email directly into collection to bypass schema requirements
    await mongoose.connection.collection('students').insertOne({ email: 'john@example.com' });

    const res = await request(app)
      .post('/complete-profile')
      .query({ token: 't1' })
      .send(validBody());
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('An account with this email already exists');
  });

  test('200 creates student, deletes temp user, sends welcome email', async () => {
    await TempUser.create({ email: "john@example.com", name: "John Doe", token: 't1', passwordHash: 'hash' });

    const body = validBody();
    const res = await request(app)
      .post('/complete-profile')
      .query({ token: 't1' })
      .send(body);

    expect(res.status).toBe(200);

    const student = await Student.findOne({ email: body.email });
    expect(student).toBeTruthy();
    expect(student.enrollmentNumber).toBe(body.enrollmentNumber);

    const remainingTemp = await TempUser.findOne({ token: 'good-token' });
    expect(remainingTemp).toBeNull();

    expect(sendWelcomeEmail).toHaveBeenCalledWith(body.email, body.name);
  });

  test('500 on DB error (disconnected)', async () => {
    await TempUser.create({ email: "john@example.com", name: "John Doe", token: 't1', passwordHash: 'hash' });
    // Disconnect DB to force an operational error
    await mongoose.disconnect();

    const res = await request(app)
      .post('/complete-profile')
      .query({ token: 't1' })
      .send(validBody());

    expect(res.status).toBe(500);
    // Reconnect for any future tests (suite ends here, but safe to restore)
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });
});