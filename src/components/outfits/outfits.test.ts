import User from '../users/model';
import { Types } from 'mongoose';
import { generateToken } from '../users/utils/jwt';
import request from 'supertest';
import { startApp } from '../../app';
import Clothes from '../clothes/models';
import Outfits from './models';
import dbConnection from '../../config/dbConnection';
import { ClothesInput } from '../clothes/validationSchema';

let token: string | undefined;
let userID: Types.ObjectId;
let outfitID: Types.ObjectId;
let nonExistingOutfitID: Types.ObjectId = new Types.ObjectId();
let clothesArray: any = [];
const existingUser = {
    firstName: 'Thomas',
    lastName: 'Hatek',
    email: 'thomashatek@gmail.com',
    password: '1234567aA'
};

const existingClothes: ClothesInput[] = [
    {
        name: 'Mock-neck sweater',
        category: 'sweater',
        condition: 'new',
        size: 'm',
        color: 'black',
        favorited: false
    },
    {
        name: 'Jeans',
        category: 'pants',
        condition: 'new',
        size: 'm',
        color: 'blue',
        favorited: false
    }
];

let app: any;

const startTest = async () => {
    await dbConnection();
    app = await startApp(); // Ensure startApp is correctly setting up the Express app
    return app;
};

beforeAll(async () => {
    await startTest();
    await Outfits.deleteMany();
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
    const clothesPromises = existingClothes.map(async (clothes) => {
        const newClothes = new Clothes({ ...clothes, userID });
        const createdClothes = await newClothes.save();
        return createdClothes._id;
    });
    clothesArray = await Promise.all(clothesPromises);
});

const nonExistingOutfit = {
    name: 'Outfit1',
    clothes: clothesArray
};
let createdOutfitIdWithImage: Types.ObjectId;

describe('create an outfit', () => {
    it('Should return 201 and outfit instance without image', async () => {
        const response = await request(app)
            .post('/api/outfits/')
            .set('Cookie', `token=${token}`)
            .send({ name: 'Outfit1', clothes: clothesArray })
            .expect(201);
        outfitID = response.body._id;
    });
    it('Should return 201 and clothes instance along with image link', async () => {
        const response = await request(app)
            .post('/api/outfits/')
            .set('Cookie', `token=${token}`)
            .set('Content-Type', 'multipart/form-data')
            .field('name', nonExistingOutfit.name)
            .field('clothes', String(clothesArray[0]._id))
            .field('clothes', String(clothesArray[1]._id))
            .attach('image', `${__dirname}/image.jpg`)
            .expect(201);

        expect(response.body).toEqual(
            expect.objectContaining({
                __v: 0,
                _id: expect.any(String),
                userID: expect.any(String),
                cloudinaryID: expect.any(String),
                favorited: expect.any(Boolean),
                name: expect.any(String),
                clothes: expect.any(Array),
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            })
        );
        createdOutfitIdWithImage = response.body._id;
    });
});
describe('get all outfits', () => {
    it('should return 200 and all outfits', async () => {
        await request(app)
            .get('/api/outfits/')
            .set('Cookie', `token=${token}`)
            .expect(200);
    });
});
describe('get all favorited outfits', () => {
    it('should return 200 and all outfits', async () => {
        await request(app)
            .get('/api/outfits/favorite')
            .set('Cookie', `token=${token}`)
            .expect(200);
    });
});

describe('update an outfit', () => {
    it('should return 200 and update the outfit', async () => {
        await request(app)
            .put(`/api/outfits/${outfitID}`)
            .set('Cookie', `token=${token}`)
            .send({ name: 'Outfit2', clothes: clothesArray })
            .expect(200);
    });
    it('should return 404 if outfit is nonexisting', async () => {
        await request(app)
            .put(`/api/outfits/${nonExistingOutfitID}`)
            .set('Cookie', `token=${token}`)
            .send({ name: 'Outfit2', clothes: clothesArray })
            .expect(404);
    });
    it('Should return 200 and updated clothes instance along with image link where there was not image initially', async () => {
        const response = await request(app)
            .put(`/api/outfits/${outfitID}`)
            .set('Cookie', `token=${token}`)
            .set('Content-Type', 'multipart/form-data')
            .field('name', 'outfit3')
            .attach('image', `${__dirname}/image.jpg`)
            .expect(200);

        expect(response.body).toEqual(
            expect.objectContaining({
                __v: 0,
                _id: expect.any(String),
                userID: expect.any(String),
                cloudinaryID: expect.any(String),
                favorited: expect.any(Boolean),
                name: expect.any(String),
                clothes: expect.any(Array),
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            })
        );
        createdOutfitIdWithImage = response.body._id;
    });
    it('Should return 200 and updated clothes instance along with image link where there was image initially', async () => {
        const response = await request(app)
            .put(`/api/outfits/${createdOutfitIdWithImage}`)
            .set('Cookie', `token=${token}`)
            .set('Content-Type', 'multipart/form-data')
            .field('name', 'outfit3')
            .attach('image', `${__dirname}/image.jpg`)
            .expect(200);

        expect(response.body).toEqual(
            expect.objectContaining({
                __v: 0,
                _id: expect.any(String),
                userID: expect.any(String),
                cloudinaryID: expect.any(String),
                favorited: expect.any(Boolean),
                name: expect.any(String),
                clothes: expect.any(Array),
                createdAt: expect.any(String),
                updatedAt: expect.any(String)
            })
        );
    });
});

describe('favoriting an outfit', () => {
    it('should not return 200 outfit is nonexisting', async () => {
        await request(app)
            .patch(`/api/outfits/favorite/${nonExistingOutfitID}`)
            .set('Cookie', `token=${token}`)
            .expect(400);
    });
    it('should return 200 and favorite the selected outfit', async () => {
        await request(app)
            .patch(`/api/outfits/favorite/${outfitID}`)
            .set('Cookie', `token=${token}`)
            .expect(200);
    });
});
describe('unfavoriting an outfit', () => {
    it('should not return 200 outfit is nonexisting', async () => {
        await request(app)
            .patch(`/api/outfits/unfavorite/${nonExistingOutfitID}`)
            .set('Cookie', `token=${token}`)
            .expect(400);
    });
    it('should return 200 and favorite the selected outfit', async () => {
        await request(app)
            .patch(`/api/outfits/unfavorite/${outfitID}`)
            .set('Cookie', `token=${token}`)
            .expect(200);
    });
});

describe('delete an outfit', () => {
    it('should return 200 and delete the outfit', async () => {
        await request(app)
            .delete(`/api/outfits/${outfitID}`)
            .set('Cookie', `token=${token}`)
            .expect(200);
    });
    it('should return 404 if outfit is nonexisting', async () => {
        await request(app)
            .delete(`/api/outfits/${nonExistingOutfitID}`)
            .set('Cookie', `token=${token}`)
            .expect(404);
    });
});
