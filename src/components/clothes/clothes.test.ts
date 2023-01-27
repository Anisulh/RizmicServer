import User from '../users/model';
import bcrypt from 'bcrypt';
import { AnyObject } from 'mongoose';
import { generateToken } from '../users/services/jwt';
import request from 'supertest';
import app from '../../server';

const existingUser = {
    firstName: 'Thomas',
    lastName: 'Hatek',
    email: 'thomashatek@gmail.com',
    password: '1234567aA'
};
let token: string | undefined;

beforeAll(async () => {
    const newUser = { ...existingUser };
    const userInDB = await User.findOne({ email: existingUser.email }).lean();
    if (!userInDB) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(existingUser.password, salt);
        newUser.password = hashedPassword;
        const createdUser: AnyObject = await User.create(existingUser);
        if (createdUser) {
            const createdUserData = { ...createdUser._doc };
            token = generateToken(createdUserData._id);
        }
    } else {
        token = generateToken(userInDB._id);
    }
});

describe('Authorization middleware', () => {
    it('return 200', async () => {
        return await request(app)
            .get('/clothes/')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
    it('Should return 400 if no token provided', async () => {
        return await request(app).get('/clothes/').expect(400);
    });
    it('Should return 400 if invalid token provided', async () => {
        const invalidToken = 'invalid';
        return await request(app)
            .get('/clothes/')
            .set('Authorization', `Bearer ${invalidToken}`)
            .expect(400);
    });
});
