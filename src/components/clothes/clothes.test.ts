import User from '../users/model';
import bcrypt from 'bcrypt';
import { AnyObject, Types } from 'mongoose';
import { generateToken } from '../users/services/jwt';
import request from 'supertest';
import { initializeServer } from '../../server';
import Clothes from './models';
import { Application } from 'express';

const existingUser = {
    firstName: 'Thomas',
    lastName: 'Hatek',
    email: 'thomashatek@gmail.com',
    password: '1234567aA'
};

const invalidClothes = {
    bodyLocation: ['upperBody'],
    category: 'sweater',
    variant: 'mockNeck'
};

const nonExistingClothes = {
    bodyLocation: ['upperBody'],
    category: 'sweater',
    variant: 'Mock-neck',
    color: 'black',
    layerable: true
};
const nonExistingClothesWithImage = {
    category: 'sweater',
    variant: 'Mock-neck',
    color: 'black',
    layerable: true
};
const existingClothes = {
    bodyLocation: ['lowerBody'],
    category: 'shirt',
    variant: 'buttonDown',
    color: 'green',
    layerable: true
};
const existingClothesWithImage = {
    bodyLocation: ['lowerBody'],
    category: 'pants',
    variant: 'Joggers',
    color: 'blue',
    layerable: false
};
let token: string | undefined;
let createdClothesId: Types.ObjectId;
let createdClothesIdWithImage: Types.ObjectId;
let userID: Types.ObjectId;
const app = initializeServer();
beforeAll(async () => {
    await Clothes.deleteMany();
    const newUser = { ...existingUser };
    const userInDB = await User.findOne({ email: existingUser.email }).lean();
    if (!userInDB) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(existingUser.password, salt);
        newUser.password = hashedPassword;
        const createdUser: AnyObject = await User.create(existingUser);
        if (createdUser) {
            const createdUserData = { ...createdUser._doc };
            token = generateToken(createdUserData._id) as string;
            userID = createdUserData._id;
        }
    } else {
        userID = userInDB._id;
        token = generateToken(userInDB._id) as string;
    }
    const clothesData = { ...existingClothes, userID };
    const createdClothes = await Clothes.create(clothesData);
    createdClothesId = createdClothes._id;
});

describe('Authorization Middleware', () => {
    it('Should return 200 if valid token', async () => {
        return await request(app)
            .get('/api/clothes/')
            .set('Cookie', `token=${token}`)
            .expect(200);
    });
    it('Should return 400 if no token provided', async () => {
        return await request(app).get('/api/clothes/').expect(401);
    });
    it('Should return 400 if invalid token provided', async () => {
        const invalidToken = 'invalid';
        return await request(app)
            .get('/api/clothes/')
            .set('Cookie', `token=${invalidToken}`)
            .expect(401);
    });
});

describe('Get all clothes', () => {
    it('Should return 200 and all clothes instances', async () => {
        const response = await request(app)
            .get('/api/clothes/')
            .set('Cookie', `token=${token}`)
            .expect(200);

        expect(response.body).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    __v: 0,
                    _id: expect.any(String),
                    userID: expect.any(String),
                    bodyLocation: expect.arrayContaining([expect.any(String)]),
                    category: expect.any(String),
                    variant: expect.any(String),
                    layerable: expect.any(Boolean),
                    color: expect.any(String),
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String)
                })
            ])
        );
    });
});

describe('Create new clothes', () => {
    it('Should return 201 and clothes instance along with image link', async () => {
        const response = await request(app)
            .post('/api/clothes/')
            .set('Cookie', `token=${token}`)
            .set('Content-Type', 'multipart/form-data')
            .field(nonExistingClothesWithImage)
            .field('bodyLocation[]', 'upperBody')
            .attach('image', `${__dirname}/image.jpg`)
            .expect(201);
        expect(response.body).toEqual(
            expect.objectContaining({
                __v: 0,
                _id: expect.any(String),
                cloudinaryID: expect.any(String),
                userID: expect.any(String),
                bodyLocation: expect.arrayContaining([expect.any(String)]),
                category: expect.any(String),
                variant: expect.any(String),
                layerable: expect.any(Boolean),
                color: expect.any(String),
                image: expect.any(String),
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            })
        );
        createdClothesIdWithImage = response.body._id;
    });
    it('Should return 201 and clothes instance without image link', async () => {
        const response = await request(app)
            .post('/api/clothes/')
            .set('Cookie', `token=${token}`)
            .send(nonExistingClothes)
            .expect(201);
        expect(response.body).toEqual(
            expect.objectContaining({
                __v: 0,
                _id: expect.any(String),
                userID: expect.any(String),
                bodyLocation: expect.arrayContaining([expect.any(String)]),
                category: expect.any(String),
                variant: expect.any(String),
                layerable: expect.any(Boolean),
                color: expect.any(String),
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            })
        );
    });
    it('Should return 400 when a required field is missing', async () => {
        return await request(app)
            .post('/api/clothes/')
            .set('Cookie', `token=${token}`)
            .send(invalidClothes)
            .expect(400);
    });
});

describe('Get specific clothes', () => {
    it('Should return 200 and clothes instance', async () => {
        const response = await request(app)
            .get(`/api/clothes/${createdClothesId}`)
            .set('Cookie', `token=${token}`)
            .expect(200);

        expect(response.body).toMatchObject({
            __v: 0,
            _id: expect.any(String),
            userID: expect.any(String),
            bodyLocation: expect.arrayContaining([expect.any(String)]),
            category: expect.any(String),
            variant: expect.any(String),
            layerable: expect.any(Boolean),
            color: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
        });
    });
});

describe('Updating Clothes', () => {
    it('Should return 200 and updated clothes instance that didnt have image with image', async () => {
        const response = await request(app)
            .put(`/api/clothes/${createdClothesId}`)
            .set('Cookie', `token=${token}`)
            .field({ color: 'red', category: 'sweater' })
            .attach('image', `${__dirname}/image.jpg`)
            .expect(200);
        expect(response.body).toEqual(
            expect.objectContaining({
                __v: 0,
                _id: expect.any(String),
                cloudinaryID: expect.any(String),
                userID: expect.any(String),
                bodyLocation: expect.arrayContaining([expect.any(String)]),
                category: expect.any(String),
                variant: expect.any(String),
                layerable: expect.any(Boolean),
                color: expect.any(String),
                image: expect.any(String),
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            })
        );
    });
    it('Should return 200 and updated clothes instance, replacing old image with new image', async () => {
        const response = await request(app)
            .put(`/api/clothes/${createdClothesIdWithImage}`)
            .set('Cookie', `token=${token}`)
            .field({ color: 'red', category: 'sweater' })
            .attach('image', `${__dirname}/image.jpg`)
            .expect(200);
        expect(response.body).toEqual(
            expect.objectContaining({
                __v: 0,
                _id: expect.any(String),
                cloudinaryID: expect.any(String),
                userID: expect.any(String),
                bodyLocation: expect.arrayContaining([expect.any(String)]),
                category: expect.any(String),
                variant: expect.any(String),
                layerable: expect.any(Boolean),
                color: expect.any(String),
                image: expect.any(String),
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            })
        );
    });
});

describe('Deleteing Clothes', () => {
    it('Should return 200 and id of deleted clothes', async () => {
        const response = await request(app)
            .delete(`/api/clothes/${createdClothesId}`)
            .set('Cookie', `token=${token}`)
            .expect(200);

        expect(response.body).toMatchObject({
            id: expect.any(String)
        });
    });
});
