const prisma = require('../../config/prismaClient');
const { hashPassword, comparePassword } = require('../../utils/hash');
const { generateToken } = require('../../utils/auth');

module.exports = {
    Query: {
        students: async () => await prisma.student.findMany(),
        student: async (_, { id }) => await prisma.student.findUnique({ where: { id: Number(id) } }),
    },

    Mutation: {
        registerStudent: async (_, args) => {
            const { password } = args;
            const hashed = await hashPassword(password);

            const student = await prisma.student.create({
                data: { ...args, password: hashed },
            });

            const token = generateToken(student);
            return { token, student };
        },

        loginStudent: async (_, { email, password }) => {
            const student = await prisma.student.findUnique({ where: { email } });
            if (!student) throw new Error("Student not found");

            const valid = await comparePassword(password, student.password);
            if (!valid) throw new Error("Invalid credentials");

            const token = generateToken(student);
            return { token, student };
        },

        activateStudent: async (_, { id }) => {
            const student = await prisma.student.update({
                where: { id: Number(id) },
                data: { isActivated: true },
            });
            return student;
        },
    },
};
