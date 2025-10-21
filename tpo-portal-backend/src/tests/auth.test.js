const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../utils/mailer', () => ({
    sendVerificationEmail: jest.fn(() => Promise.resolve()),
}));

let mongod;
let app;
let TempUser;
let Student;
const { sendVerificationEmail } = require('../utils/mailer');

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    // Import models and router AFTER connecting
    TempUser = require('../models/TempUser');
    Student = require('../models/Student');
    const authRouter = require('../routes/auth');

    app = express();
    app.use(express.json());
    app.use('/', authRouter);
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

describe('POST /register', () => {
    test('400 when required body fields are missing', async () => {
        const res = await request(app)
            .post('/register')
            .send({ name: 'John Doe', password: "pass" });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Please fill all fields');
    });

    test('400 when email domain is not correct', async () => {
        const res = await request(app)
            .post('/register')
            .send({ email: 'john@example.com', name: 'John Doe', password: "pass" });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email must be @nitsri.ac.in');
    });

    test('400 when account with email already exist', async () => {
        await mongoose.connection.collection('students').insertOne({ email: 'john@nitsri.ac.in' });
        const res = await request(app)
            .post('/register')
            .send({ email: 'john@nitsri.ac.in', name: 'John Doe', password: "pass" });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Account with this email already exists');
    });

    test('200 created temp user and verification email sent', async () => {
        const body = { email: 'john@nitsri.ac.in', name: 'John Doe', password: "pass" };
        const res = await request(app)
            .post('/register')
            .send({ email: 'john@nitsri.ac.in', name: 'John Doe', password: "pass" });
        expect(res.status).toBe(200);
        const tempUser = await TempUser.findOne({ email: body.email });
        expect(tempUser).toBeTruthy();

        expect(sendVerificationEmail).toHaveBeenCalledWith(body.email, tempUser.token);
    });

    test('500 on DB error (disconnected)', async () => {
        const body = { email: 'john@nitsri.ac.in', name: 'John Doe', password: "pass" };
        // Disconnect DB to force an operational error
        await mongoose.disconnect();

        const res = await request(app)
            .post('/register')
            .send(body);

        expect(res.status).toBe(500);
        // Reconnect for any future tests (suite ends here, but safe to restore)
        const uri = mongod.getUri();
        await mongoose.connect(uri);
    });
});

describe('GET /verify', () => {
    test('400 when token is missing', async () => {
        const res = await request(app)
            .get('/verify')
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Verification link is missing');
    });

    test('401 when token is invalid or expired', async () => {
        const res = await request(app)
            .get('/verify')
            .query({token: 'bad-token'})
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Verification link is invalid or has expired');
    });

    test('200 verification gets completed', async () => {
        await TempUser.create({ email: "john@nitsri.ac.in", name: "John Doe", token: 't1', passwordHash: 'hash' });
        const res = await request(app)
            .get('/verify')
            .query({token: 't1'})
        expect(res.status).toBe(200);
        expect(res.body.valid).toBeTruthy();
        expect(res.body.message).toBe('Email Verified Successfully. Complete Profile!!!');
        expect(res.body.name).toBe('John Doe');
        expect(res.body.email).toBe('john@nitsri.ac.in');

        const tempUser = await TempUser.findOne({email: 'john@nitsri.ac.in'});
        expect(tempUser.verified).toBeTruthy();
    });

    test('200 already verified', async () => {
        await TempUser.create({ email: "john@nitsri.ac.in", name: "John Doe", token: 't1', passwordHash: 'hash', verified: true });
        const res = await request(app)
            .get('/verify')
            .query({token: 't1'})
        expect(res.status).toBe(200);
        expect(res.body.valid).toBeTruthy();
        expect(res.body.message).toBe('Email already verified. Fill details to complete registration.');
        expect(res.body.name).toBe('John Doe');
        expect(res.body.email).toBe('john@nitsri.ac.in');

        const tempUser = await TempUser.findOne({email: 'john@nitsri.ac.in'});
        expect(tempUser.verified).toBeTruthy();
    });

    test('500 on DB error (disconnected)', async () => {
        await TempUser.create({ email: "john@nitsri.ac.in", name: "John Doe", token: 't1', passwordHash: 'hash' });
        // Disconnect DB to force an operational error
        await mongoose.disconnect();

        const res = await request(app)
            .get('/verify')
            .query({token: 't1'});

        expect(res.status).toBe(500);
        // Reconnect for any future tests (suite ends here, but safe to restore)
        const uri = mongod.getUri();
        await mongoose.connect(uri);
    });
})