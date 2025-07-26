// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { UserDocument } from './user.schema';
// import { SafeUserDto } from '../dtos/safeUser.dto';
// @Injectable()
// export class RepositoryService {
//   constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

//   async getAllUsers() {
//     return await this.userModel.find({}, 'email').lean();
//   }

//   async moderateUser(
//     _id: string,
//     { email, roles, isVerified }: Omit<SafeUserDto, '_id'>,
//   ) {
//     await this.userModel.updateOne(
//       { _id },
//       {
//         $set: {
//           email,
//           roles,
//           isVerified,
//         },
//       },
//     );
//   }

//   async changePassword(_id: string, password: string) {
//     await this.userModel.updateOne({ _id }, { $set: { password } });
//   }

//   async insertOne({
//     email,
//     password,
//     verificationToken,
//     verificationTokenExpires,
//   }: {
//     email: string;
//     password: string;
//     verificationToken: string;
//     verificationTokenExpires: number;
//   }): Promise<void> {
//     await this.userModel.create({
//       email,
//       password,
//       verificationToken,
//       verificationTokenExpires,
//     });
//   }

//   async findOne(id: string): Promise<UserDocument | null> {
//     return this.userModel.findOne({ _id: id });
//   }

//   async findOneByEmail(email: string): Promise<UserDocument | null> {
//     return this.userModel.findOne({ email });
//   }

//   async findOneByVerificationToken(
//     token: string,
//   ): Promise<UserDocument | null> {
//     return this.userModel.findOne({ verificationToken: token });
//   }

//   async findOneByEmailToken(token: string): Promise<UserDocument | null> {
//     return this.userModel.findOne({ emailChangeToken: token });
//   }

//   async findOneByPasswordResetToken(
//     token: string,
//   ): Promise<UserDocument | null> {
//     return this.userModel.findOne({ passwordResetToken: token });
//   }

//   async addRefreshToken(id: string, token: string): Promise<void> {
//     await this.userModel.updateOne(
//       { _id: id },
//       { $push: { refreshTokens: token } },
//     );
//   }

//   async replaceRefreshToken(
//     id: string,
//     oldToken: string,
//     newToken: string,
//   ): Promise<void> {
//     const result = await this.userModel.updateOne(
//       { _id: id, refreshTokens: oldToken },
//       { $set: { 'refreshTokens.$': newToken } },
//     );

//     // if old token hasn't been found, just add a new one
//     if (result.matchedCount === 0) {
//       await this.userModel.updateOne(
//         { _id: id },
//         { $push: { refreshTokens: newToken } },
//       );
//     }
//   }

//   async removeRefreshToken(userId: string, token: string): Promise<void> {
//     await this.userModel.updateOne(
//       { _id: userId },
//       { $pull: { refreshTokens: token } },
//     );
//   }

//   async trimRefreshTokens(userId: string, maxTokens = 5): Promise<void> {
//     await this.userModel.updateOne(
//       { _id: userId },
//       {
//         $push: {
//           refreshTokens: {
//             $each: [],
//             $slice: -maxTokens, // leaves 5 last (most recent) tokens
//           },
//         },
//       },
//     );
//   }

//   async setNewVerificationToken(
//     email: string,
//     password: string,
//     token: string,
//     expiresAt: number,
//   ): Promise<void> {
//     await this.userModel.updateOne(
//       { email },
//       {
//         $set: {
//           password,
//           verificationToken: token,
//           verificationTokenExpires: expiresAt,
//         },
//       },
//     );
//   }

//   async cancelScheduledDeletion(userId: string): Promise<void> {
//     await this.userModel.updateOne(
//       { _id: userId },
//       {
//         $unset: {
//           isDeletionPending: '',
//           deletionScheduledAt: '',
//         },
//       },
//     );
//   }

//   async updatePasswordAndClearTokens(
//     email: string,
//     hashedPassword: string,
//   ): Promise<void> {
//     await this.userModel.updateOne(
//       { email },
//       {
//         $set: {
//           password: hashedPassword,
//           refreshTokens: [],
//         },
//       },
//     );
//   }

//   async clearTokens(id: string) {
//     await this.userModel.updateOne(
//       { _id: id },
//       { $set: { refreshTokens: [] } },
//     );
//   }

//   async setNewPasswordFromResetToken(
//     token: string,
//     newPassword: string,
//   ): Promise<void> {
//     await this.userModel.updateOne(
//       { passwordResetToken: token },
//       {
//         $set: {
//           password: newPassword,
//           refreshTokens: [],
//         },
//         $unset: {
//           passwordResetToken: '',
//           passwordResetTokenExpires: '',
//         },
//       },
//     );
//   }

//   async markUserForDeletion(
//     email: string,
//     deletionScheduledAt: number,
//   ): Promise<void> {
//     await this.userModel.updateOne(
//       { email },
//       {
//         $set: {
//           isDeletionPending: true,
//           deletionScheduledAt,
//         },
//       },
//     );
//   }

//   async markEmailChangePending(
//     id: string,
//     pendingEmail: string,
//     emailChangeToken: string,
//     emailChangeTokenExpires: number,
//   ): Promise<void> {
//     await this.userModel.updateOne(
//       { _id: id },
//       {
//         $set: {
//           pendingEmail,
//           emailChangeToken,
//           emailChangeTokenExpires,
//         },
//       },
//     );
//   }

//   async verifyAccount(id: string): Promise<void> {
//     await this.userModel.updateOne(
//       { _id: id },
//       {
//         $set: {
//           isVerified: true,
//         },
//         $unset: {
//           verificationToken: '',
//           verificationTokenExpires: '',
//         },
//       },
//     );
//   }

//   async confirmEmailChange(userId: string, newEmail: string): Promise<void> {
//     await this.userModel.updateOne(
//       { _id: userId },
//       {
//         $set: {
//           email: newEmail,
//         },
//         $unset: {
//           pendingEmail: '',
//           emailChangeToken: '',
//           emailChangeTokenExpires: '',
//         },
//       },
//     );
//   }

//   async remindPassword(
//     email: string,
//     resetToken: string,
//     passwordResetTokenExpires: number,
//   ): Promise<void> {
//     await this.userModel.updateOne(
//       { email },
//       {
//         $set: {
//           passwordResetToken: resetToken,
//           passwordResetTokenExpires,
//         },
//       },
//     );
//   }
// }
