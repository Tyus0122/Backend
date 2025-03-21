constants = {
  USER_NOT_FOUND: "User not found",
  SALT_ROUNDS: 10,
  UNAUTHORIZED: "User unauthorized",
  JWT_EXPIRED: "JWT expired",
  USER_ALREADY_EXISTS: "User already exists",
  ERROR_UPLOADING_FILE: "Error uploading file",
  INVALID_OTP: "Invalid Otp",
  PAGE_LIMIT: 15
}

const limitHelper = (page) => {
  return [
    {
      $skip: constants.PAGE_LIMIT * parseInt(page)
    },
    {
      $limit: constants.PAGE_LIMIT
    },
  ]
}

module.exports = {
  constants,
  limitHelper
}