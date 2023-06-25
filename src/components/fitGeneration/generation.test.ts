import User from '../users/model';
import bcrypt from 'bcrypt';
import { AnyObject, Types } from 'mongoose';
import { generateToken } from '../users/services/jwt';
import request from 'supertest';
import app from '../../server';
import Clothes from '../clothes/models';

let token: string | undefined;
let userID: Types.ObjectId;
const existingUser = {
    firstName: 'Thomas',
    lastName: 'Hatek',
    email: 'thomashatek@gmail.com',
    password: '1234567aA'
};

const existingUpperBodyClothes = [
    {
        bodyLocation: ['upperBody'],
        category: 'sweater',
        variant: 'Mock-neck',
        color: 'rgb(50,205,50)',
        layerable: true
    },
    {
        bodyLocation: ['upperBody'],
        category: 'tshirt',
        variant: 'crew-neck',
        color: 'rgb(155, 102, 112)',
        layerable: true
    },
    {
        bodyLocation: ['upperBody'],
        category: 'tshirt',
        variant: 'jersey',
        color: 'rgb(90, 146, 237)',
        layerable: true
    }
];

const existingLowerBodyClothes = [
    {
        bodyLocation: ['lowerBody'],
        category: 'shorts',
        variant: 'chino',
        color: 'rgb(127,255,0)',
        layerable: true
    },
    {
        bodyLocation: ['lowerBody'],
        category: 'pants',
        variant: 'jeans',
        color: 'rgb(155, 92, 102)',
        layerable: true
    },
    {
        bodyLocation: ['lowerBody'],
        category: 'pants',
        variant: 'item',
        color: 'rgb(34, 108, 227)',
        layerable: true
    }
];

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
            token = generateToken(createdUserData._id);
            userID = createdUserData._id;
        }
    } else {
        userID = userInDB._id;
        token = generateToken(userInDB._id);
    }
    existingUpperBodyClothes.map(async (item) => {
        try {
            const clothesData = { ...item, userID };
            await Clothes.create(clothesData);
        } catch (error) {
            console.log(error);
        }
    });
    existingLowerBodyClothes.map(async (item) => {
        try {
            const clothesData = { ...item, userID };
            await Clothes.create(clothesData);
        } catch (error) {
            console.log(error);
        }
    });
});

describe('Generate fit', () => {
    it('Should return 200 and all generated instances', async () => {
        const response = await request(app)
            .post('/generation/')
            .set('Authorization', `Bearer ${token}`)
            .send({ style: 'monochrome' })
            .expect(200);
    });
});
