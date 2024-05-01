import User from '../users/model';
import { Types } from 'mongoose';
import { generateToken } from '../../library/jwt';
import request from 'supertest';
import { startApp } from '../../app';
import Clothes from './models';
import dbConnection from '../../config/dbConnection';
import { ClothesInput } from './validationSchema';

const randomId = new Types.ObjectId();

const existingUser = {
    firstName: 'Thomas',
    lastName: 'Hatek',
    email: 'thomashatek@gmail.com',
    password: '1234567aA'
};

const invalidClothes = {
    name: 'Mock-neck sweater',
    category: 'sweater',
    size: 'm',
    color: 'black',
    favorited: false
};

const nonExistingClothes: ClothesInput = {
    name: 'Mock-neck sweater',
    category: 'sweater',
    condition: 'new',
    size: 'm',
    color: 'black',
    favorited: false
};
const nonExistingClothesWithImage: ClothesInput = {
    name: 'Mock-neck sweater',
    category: 'sweater',
    condition: 'new',
    size: 'm',
    color: 'black',
    favorited: false
};
const existingClothes: ClothesInput = {
    name: 'Mock-neck sweater',
    category: 'sweater',
    condition: 'new',
    size: 'm',
    color: 'black',
    favorited: false
};
const existingClothesWithImage: ClothesInput = {
    name: 'Mock-neck sweater',
    category: 'sweater',
    condition: 'new',
    size: 'm',
    color: 'black',
    favorited: false
};
let token: string | undefined;
let createdClothesId: Types.ObjectId;
let createdClothesIdWithImage: Types.ObjectId;
let userID: Types.ObjectId;
let app: any;

const startTest = async () => {
    await dbConnection();
    app = await startApp(); // Ensure startApp is correctly setting up the Express app
    return app;
};
beforeAll(async () => {
    await startTest();
    await Clothes.deleteMany();
    const newUser = new User(existingUser);
    const userInDB = await User.findOne({ email: existingUser.email }).lean();
    if (!userInDB) {
        const createdUser = await newUser.save();
        token = generateToken(createdUser._id);
        userID = createdUser._id;
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
                    favorited: expect.any(Boolean),
                    category: expect.any(String),
                    name: expect.any(String),
                    size: expect.any(String),
                    condition: expect.any(String),
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
            .field('name', nonExistingClothesWithImage.name)
            .field('category', nonExistingClothesWithImage.category)
            .field('condition', nonExistingClothesWithImage.condition)
            .field('size', nonExistingClothesWithImage.size)
            .field('color', nonExistingClothesWithImage.color)
            .field(
                'favorited',
                nonExistingClothesWithImage.favorited.toString()
            )
            .attach('image', `${__dirname}/image.jpg`)
            .expect(201);
        expect(response.body).toEqual(
            expect.objectContaining({
                __v: 0,
                _id: expect.any(String),
                userID: expect.any(String),
                cloudinaryID: expect.any(String),
                favorited: expect.any(Boolean),
                category: expect.any(String),
                name: expect.any(String),
                size: expect.any(String),
                condition: expect.any(String),
                color: expect.any(String),
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
                favorited: expect.any(Boolean),
                category: expect.any(String),
                name: expect.any(String),
                size: expect.any(String),
                condition: expect.any(String),
                color: expect.any(String),
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            })
        );
    });
    it('Should return 422 when a required field is missing', async () => {
        return await request(app)
            .post('/api/clothes/')
            .set('Cookie', `token=${token}`)
            .send(invalidClothes)
            .expect(422);
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
            favorited: expect.any(Boolean),
            category: expect.any(String),
            name: expect.any(String),
            size: expect.any(String),
            condition: expect.any(String),
            color: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
        });
    });
    it('Should return 404 when clothes does not exist', async () => {
        return await request(app)
            .get(`/api/clothes/${randomId}`)
            .field({ color: 'red', category: 'sweater' })
            .set('Cookie', `token=${token}`)
            .expect(404);
    });
});

describe('Updating Clothes', () => {
    it('Should return 200 and updated clothes instance that did not have image with image', async () => {
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
                userID: expect.any(String),
                cloudinaryID: expect.any(String),
                favorited: expect.any(Boolean),
                category: expect.any(String),
                name: expect.any(String),
                size: expect.any(String),
                condition: expect.any(String),
                color: expect.any(String),
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            })
        );
    });
    it('Should return 404 when clothes does not exist', async () => {
        return await request(app)
            .put(`/api/clothes/${randomId}`)
            .field({ color: 'red', category: 'sweater' })
            .set('Cookie', `token=${token}`)
            .expect(404);
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
                userID: expect.any(String),
                cloudinaryID: expect.any(String),
                favorited: expect.any(Boolean),
                category: expect.any(String),
                name: expect.any(String),
                size: expect.any(String),
                condition: expect.any(String),
                color: expect.any(String),
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            })
        );
    });
});

describe('Deleting Clothes', () => {
    it('Should return 200 and id of deleted clothes', async () => {
        const response = await request(app)
            .delete(`/api/clothes/${createdClothesId}`)
            .set('Cookie', `token=${token}`)
            .expect(200);

        expect(response.body).toMatchObject({
            id: expect.any(String)
        });
    });
    it('Should return 404 when clothes does not exist', async () => {
        return await request(app)
            .delete(`/api/clothes/${randomId}`)
            .set('Cookie', `token=${token}`)
            .expect(404);
    });
});
