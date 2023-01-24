import request from 'supertest';
import app from '../../server';
import User from './model';
import bcrypt from 'bcrypt';

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
    await User.deleteMany();
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
});
