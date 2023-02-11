import request from 'supertest';
import app from '../../server';
import User, { ResetToken } from './model';
import bcrypt from 'bcrypt';
import { redis } from '../../library/limiterInstances';
import { Types } from 'mongoose';

const existingUser = {
    firstName: 'Thomas',
    lastName: 'Hatek',
    email: 'thomashatek@gmail.com',
    password: '1234567aA'
};
const existingUserLogin = {
    email: 'thomashatek@gmail.com',
    password: '1234567aA'
};
const invalidUserLogin = {
    email: 'thomashatek@gmail.com',
    password: '1234567aA2'
};
const nonExistingUser = {
    firstName: 'Rod',
    lastName: 'Chainmic',
    email: 'rodchainmic@gmail.com',
    password: '123456aA',
    confirmPassword: '123456aA'
};
const nonExistingUserLogin = {
    email: 'rodchainmic@gmail.com',
    password: '123456aA'
};

beforeEach(async () => {
    await redis.flushall('ASYNC');
    await User.deleteMany();
    await ResetToken.deleteMany();
    const newUser = { ...existingUser };
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(existingUser.password, salt);
    newUser.password = hashedPassword;
    await User.create(newUser);
});

describe('User registration', () => {
    it('Should create a new user', async () => {
        const response = await request(app)
            .post('/user/register')
            .send(nonExistingUser)
            .expect(201);

        expect(response.body).toMatchObject({
            __v: 0,
            _id: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            email: expect.any(String),
            token: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
        });
    });
    it('Should return 400 if user exists', async () => {
        return request(app)
            .post('/user/register')
            .send(existingUser)
            .expect(400);
    });
});
describe('User login', () => {
    it('Should login an existing user with valid credentials and return accessToken', async () => {
        const response = await request(app)
            .post('/user/login')
            .send(existingUserLogin)
            .expect(200);
        expect(response.body).toMatchObject({
            __v: 0,
            _id: expect.any(String),
            firstName: expect.any(String),
            lastName: expect.any(String),
            email: expect.any(String),
            token: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
        });
    });
    it('Should return 400 if user does not exist in DB', async () => {
        return request(app)
            .post('/user/login')
            .send(nonExistingUserLogin)
            .expect(400);
    });
    it('Should return 429 if user inputs wrong password twice', async () => {
        const response = await request(app)
            .post('/user/login')
            .send(invalidUserLogin);

        expect(response.statusCode).toBe(400);

        const secondResponse = await request(app)
            .post('/user/login')
            .send(invalidUserLogin);
        expect(secondResponse.statusCode).toBe(429);
    });
});

describe('Forgot password', () => {
    it('Should return 400 if email does not exist while trying to reset password', async () => {
        return request(app)
            .post('/user/forgotpassword')
            .send({ email: nonExistingUserLogin.email })
            .expect(400);
    });
    it('Should return 200 if email was sent to reset password', async () => {
        const response = await request(app)
            .post('/user/forgotpassword')
            .send({ email: existingUser.email })
            .expect(200);
        console.log(response.body);
    });
});
