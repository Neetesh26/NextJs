import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByUsername(
    username: string,
    includePasswordHash = false,
  ): Promise<UserDocument | null> {
    const query = this.userModel.findOne({ username });
    if (includePasswordHash) {
      query.select('+passwordHash');
    }
    return query.exec();
  }

  async create(username: string, passwordHash: string): Promise<UserDocument> {
    return new this.userModel({ username, passwordHash }).save();
  }
}
