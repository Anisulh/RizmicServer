import User from '../users/model';
import bcrypt from 'bcrypt';
import { AnyObject, Types } from 'mongoose';
import { generateToken } from '../users/services/jwt';
import request from 'supertest';
import app from '../../server';
import Clothes from '../clothes/models';
import Outifts from './models';

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
    }
];

beforeAll(async () => {
    await Outifts.deleteMany();
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
    const upperBodyExisting = existingUpperBodyClothes.map(async (item) => {
    try {
      const clothesData = { ...item, userID };
      const createdClothes = await Clothes.create(clothesData);
      return createdClothes._id
    } catch (error) {
      console.log(error);
    }
  });
   const lowerBodyExisting = existingLowerBodyClothes.map(async (item) => {
    try {
      const clothesData = { ...item, userID };
      const createdClothes = await Clothes.create(clothesData);
      return createdClothes._id
    } catch (error) {
      console.log(error);
    }
  });
  clothesArray = await Promise.all([...upperBodyExisting, ...lowerBodyExisting]);
});

describe('create an outfit', () => {
    it('Should return 200 and all generated instances', async () => {
        const response = await request(app)
            .post('/api/outfits/')
            .set('Authorization', `Bearer ${token}`)
            .send({clothes: clothesArray})
            .expect(201);
        outfitID = response.body._id
    });
});
describe('get all outfits', () => {
    it('should return 200 and all outfits', async () => {
        await request(app)
            .get('/api/outfits/')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
});
describe('get all favorited outfits', () => {
    it('should return 200 and all outfits', async () => {
        await request(app)
            .get('/api/outfits/favorite')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
});
describe('favoriting an outfit', () => {
    it('should not return 200 outfit is nonexisting', async () => {
        await request(app)
            .patch(`/api/outfits/favorite/${nonExistingOutfitID}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400);
    });
    it('should return 200 and favorite the selected outfit', async () => {
        await request(app)
            .patch(`/api/outfits/favorite/${outfitID}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
});
describe('unfavoriting an outfit', () => {
    it('should not return 200 outfit is nonexisting', async () => {
        await request(app)
            .patch(`/api/outfits/unfavorite/${nonExistingOutfitID}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400);
    });
    it('should return 200 and favorite the selected outfit', async () => {
        await request(app)
            .patch(`/api/outfits/unfavorite/${outfitID}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
});
