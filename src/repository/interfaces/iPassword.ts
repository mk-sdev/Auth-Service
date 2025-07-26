export interface IPassword {
  changePassword(_id: string, password: string);
  updatePasswordAndClearTokens(
    email: string,
    hashedPassword: string,
  ): Promise<void>;
  setNewPasswordFromResetToken(
    token: string,
    newPassword: string,
  ): Promise<void>;
  remindPassword(
    email: string,
    resetToken: string,
    passwordResetTokenExpires: number,
  ): Promise<void>;
}
