
import bcrypt from "bcryptjs";
import type {
  JwtPayload,
  SignOptions,
} from "jsonwebtoken";
import type {
  TokenPayload,
} from "google-auth-library";

import crypto from "crypto";
import path from "path";
import ejs from "ejs";

import {
  BloodGroup,
  Role,
} from "../../../generated/prisma/enums";

import config from "../../config";
import { prisma } from "../../lib/prisma";
import { googleClient } from "../../lib/googleAuth";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import { jwtUtils } from "../../utils/jwt";

import type {
  IForgotPasswordPayload,
  IGoogleLoginPayload,
  ILoginUserPayload,
  IRegisterUserPayload,
  IRequestUser,
  IResetPasswordPayload,
  IVerifyEmailPayload,
  IDonorApplicationPayload,
  IApproveDonorPayload,
  IRejectDonorPayload,
} from "./auth.interface";

// ======================================================
// REGISTER USER
// Always REQUESTER
// ======================================================

const registerUser = async (
  payload: IRegisterUserPayload,
) => {
  const {
    name,
    password,
  } = payload;

  const email =
    payload.email
      .trim()
      .toLowerCase();

  const existingUser =
    await prisma.user.findUnique({
      where: { email },
    });

  if (existingUser) {
    if (!existingUser.emailVerified) {
      throw new Error(
        "This email is already registered but not verified. Please verify your email.",
      );
    }

    throw new Error(
      "User with this email already exists.",
    );
  }

  const hashedPassword =
    await bcrypt.hash(
      password,
      Number(
        config.bcrypt_salt_rounds,
      ) || 10,
    );

  // OTP
  const otpKey =
    `registration-otp:${email}`;

  const otp =
    crypto.randomInt(
      100000,
      1000000,
    ).toString();

  await redisClient.set(
    otpKey,
    otp,
    {
      expiration: {
        type: "EX",
        value: 5 * 60,
      },
    },
  );

  // Temporary registration data
  const registrationKey =
    `registration-data:${email}`;

  const registrationData = {
    name,
    email,
    password: hashedPassword,
  };

  await redisClient.set(
    registrationKey,
    JSON.stringify(
      registrationData,
    ),
    {
      expiration: {
        type: "EX",
        value: 5 * 60,
      },
    },
  );

  // Email
  const templatePath =
    path.join(
      process.cwd(),
      "src/app/templates/registrationOTP.ejs",
    );

  const html =
    await ejs.renderFile(
      templatePath,
      {
        name,
        email,
        otp,
        expirationMinutes: 5,
      },
    );

  await transporter.sendMail({
    from: config.email_sender,
    to: email,
    subject:
      "Email Verification",
    html,
  });

  return {
    email,
    message:
      "Registration initiated. Please verify your email.",
  };
};

// ======================================================
// VERIFY EMAIL
// ======================================================

const verifyEmail = async (
  payload: IVerifyEmailPayload,
) => {
  const email =
    payload.email
      .trim()
      .toLowerCase();

  const otp =
    payload.otp.trim();

  const existingUser =
    await prisma.user.findUnique({
      where: { email },
    });

  if (existingUser?.emailVerified) {
    throw new Error(
      "Email is already verified.",
    );
  }

  const otpKey =
    `registration-otp:${email}`;

  const redisOtp =
    await redisClient.get(
      otpKey,
    );

  if (!redisOtp) {
    throw new Error(
      "OTP expired or does not exist.",
    );
  }

  if (redisOtp !== otp) {
    throw new Error(
      "Invalid OTP.",
    );
  }

  const registrationKey =
    `registration-data:${email}`;

  const redisUserData =
    await redisClient.get(
      registrationKey,
    );

  if (!redisUserData) {
    throw new Error(
      "Registration data expired. Please register again.",
    );
  }

  const registrationData =
    JSON.parse(
      redisUserData,
    );

  const createdUser =
    await prisma.user.create({
      data: {
        name:
          registrationData.name,

        email:
          registrationData.email,

        password:
          registrationData.password,

        // IMPORTANT
        role: Role.REQUESTER,

        emailVerified: true,

        isActive: true,

        donorApplicationStatus:
          "NONE",
      },

      omit: {
        password: true,
      },
    });

  await redisClient.del([
    otpKey,
    registrationKey,
  ]);

  // Welcome email
  const templatePath =
    path.join(
      process.cwd(),
      "src/app/templates/welcome-email.ejs",
    );

  const html =
    await ejs.renderFile(
      templatePath,
      {
        name:
          createdUser.name,
      },
    );

  await transporter.sendMail({
    from: config.email_sender,
    to: createdUser.email,
    subject:
      "Welcome To Blood Donation Platform",
    html,
  });

  // JWT
  const jwtPayload = {
    userId:
      createdUser.id,
    name:
      createdUser.name,
    email:
      createdUser.email,
    role:
      createdUser.role,
  };

  const accessToken =
    jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions,
    );

  const refreshToken =
    jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions,
    );

  return {
    user: createdUser,
    accessToken,
    refreshToken,
  };
};

// ======================================================
// LOGIN
// ======================================================

const loginUser = async (
  payload: ILoginUserPayload,
) => {
  const email =
    payload.email
      .trim()
      .toLowerCase();

  const user =
    await prisma.user.findUnique({
      where: { email },
      include: {
        donorProfile: true,
      },
    });

  if (!user) {
    throw new Error(
      "Invalid email or password.",
    );
  }

  if (!user.isActive) {
    throw new Error(
      "Your account is inactive.",
    );
  }

  if (user.deletedAt) {
    throw new Error(
      "Your account has been deleted.",
    );
  }

  if (!user.emailVerified) {
    throw new Error(
      "Please verify your email first.",
    );
  }

  // Google-only account
  if (
    user.googleId &&
    !user.password
  ) {
    throw new Error(
      "This account uses Google login. Please login with Google.",
    );
  }

  if (!user.password) {
    throw new Error(
      "Password login is not available for this account.",
    );
  }

  const passwordMatched =
    await bcrypt.compare(
      payload.password,
      user.password,
    );

  if (!passwordMatched) {
    throw new Error(
      "Invalid email or password.",
    );
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken =
    jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions,
    );

  const refreshToken =
    jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions,
    );

  const {
    password,
    ...safeUser
  } = user;

  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
};

// ======================================================
// GET ME
// ======================================================

const getMe = async (
  user: IRequestUser,
) => {
  const currentUser =
    await prisma.user.findUnique({
      where: {
        id: user.userId,
      },

      include: {
        donorProfile: true,
      },

      omit: {
        password: true,
      },
    });

  if (!currentUser) {
    throw new Error(
      "User not found.",
    );
  }

  if (!currentUser.isActive) {
    throw new Error(
      "Your account is inactive.",
    );
  }

  if (currentUser.deletedAt) {
    throw new Error(
      "Your account has been deleted.",
    );
  }

  if (!currentUser.emailVerified) {
    throw new Error(
      "Email is not verified.",
    );
  }

  return currentUser;
};

// ======================================================
// REFRESH TOKEN
// ======================================================

const refreshToken = async (
  token: string,
) => {
  if (!token) {
    throw new Error(
      "Refresh token is required.",
    );
  }

  const verifiedRefreshToken =
    jwtUtils.verifyToken(
      token,
      config.jwt_refresh_secret,
    );

  if (
    !verifiedRefreshToken.success ||
    !verifiedRefreshToken.data
  ) {
    throw new Error(
      "Invalid refresh token.",
    );
  }

  const data =
    verifiedRefreshToken.data as JwtPayload;

  if (!data.userId) {
    throw new Error(
      "Invalid refresh token.",
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: data.userId,
      },
    });

  if (!user) {
    throw new Error(
      "User not found.",
    );
  }

  if (!user.isActive) {
    throw new Error(
      "Your account is inactive.",
    );
  }

  if (user.deletedAt) {
    throw new Error(
      "Your account has been deleted.",
    );
  }

  if (!user.emailVerified) {
    throw new Error(
      "Email is not verified.",
    );
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken =
    jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions,
    );

  const newRefreshToken =
    jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions,
    );

  return {
    accessToken,
    refreshToken:
      newRefreshToken,
  };
};

// ======================================================
// GOOGLE LOGIN
// ======================================================

const googleLogin = async (
  payload: IGoogleLoginPayload,
) => {
  let googlePayload:
    | TokenPayload
    | null
    | undefined;

  try {
    const ticket =
      await googleClient.verifyIdToken({
        idToken:
          payload.idToken,

        audience:
          config.google_client_id,
      });

    googlePayload =
      ticket.getPayload();
  } catch {
    throw new Error(
      "Invalid or expired Google ID token.",
    );
  }

  if (!googlePayload) {
    throw new Error(
      "Invalid Google account information.",
    );
  }

  if (!googlePayload.email) {
    throw new Error(
      "Google email not found.",
    );
  }

  if (!googlePayload.name) {
    throw new Error(
      "Google account name not found.",
    );
  }

  const email =
    googlePayload.email
      .trim()
      .toLowerCase();

  let user =
    await prisma.user.findUnique({
      where: { email },

      include: {
        donorProfile: true,
      },
    });

  // ==================================================
  // EXISTING USER
  // ==================================================

  if (user) {

    // DONOR cannot use Google
    if (user.role === Role.DONOR) {
      throw new Error(
        "Donor accounts cannot login with Google. Please use email and password.",
      );
    }

    // ADMIN cannot use Google
    if (user.role === Role.ADMIN) {
      throw new Error(
        "Google login is not available for admin accounts.",
      );
    }

    if (!user.isActive) {
      throw new Error(
        "Your account is inactive.",
      );
    }

    if (user.deletedAt) {
      throw new Error(
        "Your account has been deleted.",
      );
    }

    if (!user.emailVerified) {
      throw new Error(
        "Please verify your email first.",
      );
    }

    // ==================================================
    // PENDING DONOR APPLICATION
    // ==================================================

    if (
      user.donorApplicationStatus ===
      "PENDING"
    ) {
      throw new Error(
        "Your donor application is pending. Please use email and password login.",
      );
    }

    // ==================================================
    // PASSWORD ACCOUNT + GOOGLE
    // ==================================================

    if (
      !user.googleId &&
      user.password
    ) {
      user =
        await prisma.user.update({
          where: {
            id: user.id,
          },

          data: {
            googleId:
              googlePayload.sub,

            emailVerified:
              true,
          },

          include: {
            donorProfile: true,
          },
        });
    }

    // Different Google account
    else if (
      user.googleId &&
      user.googleId !==
        googlePayload.sub
    ) {
      throw new Error(
        "This email is already connected to another Google account.",
      );
    }
  }

  // ==================================================
  // NEW GOOGLE USER
  // ==================================================

  if (!user) {
    user =
      await prisma.user.create({
        data: {
          name:
            googlePayload.name,

          email,

          // Google users are REQUESTER
          role: Role.REQUESTER,

          googleId:
            googlePayload.sub,

          emailVerified: true,

          isActive: true,

          donorApplicationStatus:
            "NONE",
        },

        include: {
          donorProfile: true,
        },
      });

    const templatePath =
      path.join(
        process.cwd(),
        "src/app/templates/welcome-email.ejs",
      );

    const html =
      await ejs.renderFile(
        templatePath,
        {
          name: user.name,
        },
      );

    await transporter.sendMail({
      from:
        config.email_sender,

      to: user.email,

      subject:
        "Welcome To Blood Donation Platform",

      html,
    });
  }

  // ==================================================
  // JWT
  // ==================================================

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken =
    jwtUtils.createToken(
      jwtPayload,
      config.jwt_access_secret,
      config.jwt_access_expires_in as SignOptions,
    );

  const refreshToken =
    jwtUtils.createToken(
      jwtPayload,
      config.jwt_refresh_secret,
      config.jwt_refresh_expires_in as SignOptions,
    );

  const {
    password,
    ...safeUser
  } = user;

  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
};

// ======================================================
// FORGOT PASSWORD
// ======================================================

const forgotPassword = async (
  payload: IForgotPasswordPayload,
) => {
  const email =
    payload.email
      .trim()
      .toLowerCase();

  const user =
    await prisma.user.findUnique({
      where: { email },
    });

  if (!user) {
    return {
      message:
        "If this email exists, a reset OTP has been sent.",
    };
  }

  if (!user.isActive) {
    throw new Error(
      "Your account is inactive.",
    );
  }

  if (user.deletedAt) {
    throw new Error(
      "Your account has been deleted.",
    );
  }

  if (!user.emailVerified) {
    throw new Error(
      "Please verify your email first.",
    );
  }

  if (
    user.googleId &&
    !user.password
  ) {
    throw new Error(
      "This account uses Google login. Password reset is not available.",
    );
  }

  if (!user.password) {
    throw new Error(
      "Password reset is not available for this account.",
    );
  }

  const otp =
    crypto.randomInt(
      100000,
      1000000,
    ).toString();

  const key =
    `forgot-password-otp:${email}`;

  await redisClient.set(
    key,
    otp,
    {
      expiration: {
        type: "EX",
        value: 5 * 60,
      },
    },
  );

  const templatePath =
    path.join(
      process.cwd(),
      "src/app/templates/forgot-password.ejs",
    );

  const html =
    await ejs.renderFile(
      templatePath,
      {
        name: user.name,
        otp,
        expirationMinutes: 5,
      },
    );

  await transporter.sendMail({
    from: config.email_sender,
    to: user.email,
    subject:
      "Forgot Password",
    html,
  });

  return {
    message:
      "Password reset OTP has been sent to your email.",
  };
};

// ======================================================
// RESET PASSWORD
// ======================================================

const resetPassword = async (
  payload: IResetPasswordPayload,
) => {
  const email =
    payload.email
      .trim()
      .toLowerCase();

  const user =
    await prisma.user.findUnique({
      where: { email },
    });

  if (!user) {
    throw new Error(
      "Invalid reset request.",
    );
  }

  if (!user.isActive) {
    throw new Error(
      "Your account is inactive.",
    );
  }

  if (user.deletedAt) {
    throw new Error(
      "Your account has been deleted.",
    );
  }

  if (!user.emailVerified) {
    throw new Error(
      "Please verify your email first.",
    );
  }

  if (
    user.googleId &&
    !user.password
  ) {
    throw new Error(
      "This account uses Google login. Please login with Google.",
    );
  }

  if (!user.password) {
    throw new Error(
      "Password reset is not available.",
    );
  }

  const key =
    `forgot-password-otp:${email}`;

  const redisOtp =
    await redisClient.get(key);

  if (!redisOtp) {
    throw new Error(
      "OTP expired or does not exist.",
    );
  }

  if (
    redisOtp !==
    payload.otp.trim()
  ) {
    throw new Error(
      "Invalid OTP.",
    );
  }

  const hashedPassword =
    await bcrypt.hash(
      payload.newPassword,
      Number(
        config.bcrypt_salt_rounds,
      ) || 10,
    );

  await prisma.user.update({
    where: {
      id: user.id,
    },

    data: {
      password:
        hashedPassword,
    },
  });

  await redisClient.del(key);

  const templatePath =
    path.join(
      process.cwd(),
      "src/app/templates/reset-password.ejs",
    );

  const html =
    await ejs.renderFile(
      templatePath,
      {
        name: user.name,
      },
    );

  await transporter.sendMail({
    from:
      config.email_sender,

    to: user.email,

    subject:
      "Password Changed Successfully",

    html,
  });

  return {
    message:
      "Password has been reset successfully.",
  };
};

// ======================================================
// APPLY FOR DONOR
// REQUESTER -> PENDING
// ======================================================
const applyForDonor = async (payload: IDonorApplicationPayload) => {
  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
    include: {
      donorProfile: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (!user.isActive) {
    throw new Error("Your account is inactive.");
  }

  if (!user.emailVerified) {
    throw new Error("Please verify your email first.");
  }

  if (user.role === Role.DONOR) {
    throw new Error("You are already a donor.");
  }

  if (user.donorApplicationStatus === "PENDING") {
    throw new Error(
      "Your donor application is already pending review.",
    );
  }

  // ======================================================
  // BLOOD GROUP CONVERSION
  // ======================================================

  const bloodGroupMap: Record<string, BloodGroup> = {
    "A+": BloodGroup.A_POSITIVE,
    "A-": BloodGroup.A_NEGATIVE,
    "B+": BloodGroup.B_POSITIVE,
    "B-": BloodGroup.B_NEGATIVE,
    "AB+": BloodGroup.AB_POSITIVE,
    "AB-": BloodGroup.AB_NEGATIVE,
    "O+": BloodGroup.O_POSITIVE,
    "O-": BloodGroup.O_NEGATIVE,
  };

  const bloodGroup = bloodGroupMap[payload.bloodGroup];

  if (!bloodGroup) {
    throw new Error(
      "Invalid blood group. Use A+, A-, B+, B-, AB+, AB-, O+, or O-.",
    );
  }

  // ======================================================
  // UPSERT DONOR PROFILE
  // ======================================================

  await prisma.donorProfile.upsert({
    where: {
      userId: user.id,
    },

    create: {
      userId: user.id,

      bloodGroup,

      dateOfBirth: payload.dateOfBirth
        ? new Date(payload.dateOfBirth)
        : undefined,

      division: payload.division,
      district: payload.district,
      address: payload.address,

      latitude: payload.latitude,
      longitude: payload.longitude,

      appliedAt: new Date(),
      rejectedAt: null,
      rejectReason: null,
    },

    update: {
      bloodGroup,

      dateOfBirth: payload.dateOfBirth
        ? new Date(payload.dateOfBirth)
        : undefined,

      division: payload.division,
      district: payload.district,
      address: payload.address,

      latitude: payload.latitude,
      longitude: payload.longitude,

      appliedAt: new Date(),
      rejectedAt: null,
      rejectReason: null,
    },
  });

  // ======================================================
  // UPDATE APPLICATION STATUS
  // ======================================================

  await prisma.user.update({
    where: {
      id: user.id,
    },

    data: {
      donorApplicationStatus: "PENDING",
    },
  });

  return {
    message:
      "Donor application submitted. Waiting for admin approval.",
  };
};
// ======================================================
// APPROVE DONOR
// REQUESTER -> DONOR
// ======================================================

const approveDonorApplication =
  async (
    payload: IApproveDonorPayload,
  ) => {
    const user =
      await prisma.user.findUnique({
        where: {
          id: payload.userId,
        },

        include: {
          donorProfile: true,
        },
      });

    if (!user) {
      throw new Error(
        "User not found.",
      );
    }

    if (!user.donorProfile) {
      throw new Error(
        "No donor application found.",
      );
    }

    if (
      user.role !==
      Role.REQUESTER
    ) {
      throw new Error(
        "Only requester accounts can be approved as donors.",
      );
    }

    if (
      user.donorApplicationStatus !==
      "PENDING"
    ) {
      throw new Error(
        "This application is not pending.",
      );
    }

    // Make sure donor has password login
    if (!user.password) {
      throw new Error(
        "This user does not have a password login. Donor approval is not allowed.",
      );
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          role:
            Role.DONOR,

          donorApplicationStatus:
            "APPROVED",
        },

        omit: {
          password: true,
        },
      });

    await prisma.donorProfile.update({
      where: {
        userId: user.id,
      },

      data: {
        approvedAt:
          new Date(),

        rejectedAt:
          null,

        rejectReason:
          null,
      },
    });

    // Email
    const templatePath =
      path.join(
        process.cwd(),
        "src/app/templates/donor-approved.ejs",
      );

    const html =
      await ejs.renderFile(
        templatePath,
        {
          name:
            updatedUser.name,
        },
      );

    await transporter.sendMail({
      from:
        config.email_sender,

      to:
        updatedUser.email,

      subject:
        "You Are Now a Verified Donor 🩸",

      html,
    });

    return {
      message:
        "Donor application approved.",
      user:
        updatedUser,
    };
  };

// ======================================================
// REJECT DONOR
// ======================================================

const rejectDonorApplication =
  async (
    payload: IRejectDonorPayload,
  ) => {
    const user =
      await prisma.user.findUnique({
        where: {
          id: payload.userId,
        },

        include: {
          donorProfile: true,
        },
      });

    if (!user) {
      throw new Error(
        "User not found.",
      );
    }

    if (!user.donorProfile) {
      throw new Error(
        "No donor application found.",
      );
    }

    if (
      user.donorApplicationStatus !==
      "PENDING"
    ) {
      throw new Error(
        "This application is not pending.",
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        donorApplicationStatus:
          "REJECTED",
      },
    });

    await prisma.donorProfile.update({
      where: {
        userId: user.id,
      },

      data: {
        rejectedAt:
          new Date(),

        rejectReason:
          payload.reason ??
          "Not specified",
      },
    });

    return {
      message:
        "Donor application rejected.",
    };
  };

// ======================================================
// EXPORT
// ======================================================

export const AuthService = {
  registerUser,
  verifyEmail,
  loginUser,
  getMe,
  refreshToken,
  googleLogin,
  forgotPassword,
  resetPassword,
  applyForDonor,
  approveDonorApplication,
  rejectDonorApplication,
};

