import { Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  password?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

export interface IUserRegister {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword?: string;
}