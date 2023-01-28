import User from '../users/model';
import bcrypt from 'bcrypt';
import { AnyObject, Types } from 'mongoose';
import { generateToken } from '../users/services/jwt';
import request from 'supertest';
import app from '../../server';
import Clothes from './models';

const existingUser = {
    firstName: 'Thomas',
    lastName: 'Hatek',
    email: 'thomashatek@gmail.com',
    password: '1234567aA'
};

const nonExistingClothes = {
    bodyLocation: 'upperBody',
    type: 'sweater',
    specificType: 'mockNeck',
    color: 'black'
};
const existingClothes = {
    bodyLocation: 'lowerBody',
    type: 'shirt',
    specificType: 'buttonDown',
    color: 'green'
};
let token: string | undefined;
let createdClothesId: Types.ObjectId;
let userID: Types.ObjectId;

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
            userID = createdUserData._id;
        }
    } else {
        userID = userInDB._id;
        token = generateToken(userInDB._id);
    }
    const clothesData = { ...existingClothes, userID };
    const createdClothes = await Clothes.create(clothesData);
    createdClothesId = createdClothes._id;
});

describe('Authorization Middleware', () => {
    it('Should return 200 if valid token', async () => {
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

describe('Get all clothes', () => {
    it('Should return 200 and all clothes instances', async () => {
        const response = await request(app)
            .get('/clothes/')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    __v: 0,
                    _id: expect.any(String),
                    userID: expect.any(String),
                    bodyLocation: expect.arrayContaining([expect.any(String)]),
                    type: expect.any(String),
                    specificType: expect.any(String),
                    color: expect.any(String),
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String)
                })
            ])
        );
    });
});

describe('Create new clothes', () => {
    it('Should return 201 and clothes instance', async () => {
        const response = await request(app)
            .post('/clothes/')
            .set('Authorization', `Bearer ${token}`)
            .send(nonExistingClothes)
            .expect(201);
        expect(response.body).toMatchObject({
            __v: 0,
            _id: expect.any(String),
            userID: expect.any(String),
            bodyLocation: expect.arrayContaining([expect.any(String)]),
            type: expect.any(String),
            specificType: expect.any(String),
            color: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
        });
    });
});

describe('Get specific clothes', () => {
    it('Should return 200 and clothes instance', async () => {
        const response = await request(app)
            .get(`/clothes/${createdClothesId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toMatchObject({
            __v: 0,
            _id: expect.any(String),
            userID: expect.any(String),
            bodyLocation: expect.arrayContaining([expect.any(String)]),
            type: expect.any(String),
            specificType: expect.any(String),
            color: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
        });
    });
});

describe('Updating Clothes', () => {
    it('Should return 200 and updated clothes instance', async () => {
        const response = await request(app)
            .put(`/clothes/${createdClothesId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ color: 'red', type: 'sweater' })
            .expect(200);
        expect(response.body).toMatchObject({
            __v: 0,
            _id: createdClothesId,
            userID: expect.any(String),
            bodyLocation: expect.arrayContaining([expect.any(String)]),
            type: 'sweater',
            specificType: expect.any(String),
            color: 'red',
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
        });
    });
});

describe('Deleteing Clothes', () => {
    it('Should return 200 and id of deleted clothes', async () => {
        const response = await request(app)
            .delete(`/clothes/${createdClothesId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ color: 'red', type: 'sweater' })
            .expect(200);

        expect(response.body).toMatchObject({
            id: expect.any(String)
        });
    });
});
