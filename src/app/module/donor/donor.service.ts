import { BloodGroup, Role } from "../../../generated/prisma/enums";

import { prisma } from "../../lib/prisma";

import {
  IDonorProfileUpdatePayload,
} from "./donor.interface";


// ======================================================
// BLOOD GROUP MAP
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


// ======================================================
// GET DONOR PROFILE
// ======================================================

const getDonorProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    include: {
      donorProfile: true,
    },

    omit: {
      password: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.role !== Role.DONOR) {
    throw new Error("Only donors can access donor profile.");
  }

  if (!user.isActive) {
    throw new Error("Your account is inactive.");
  }

  if (user.deletedAt) {
    throw new Error("Your account has been deleted.");
  }

  return user;
};


// ======================================================
// GET DONOR APPLICATION STATUS
// ======================================================

const getDonorApplicationStatus = async (
  userId: string,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
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

  return {
    role: user.role,
    applicationStatus:
      user.donorApplicationStatus,
    donorProfile: user.donorProfile,
  };
};
export const DonorService = {
  getDonorProfile,
  getDonorApplicationStatus,
//   updateDonorProfile,
//   getMyNotifications,
//   getUnreadNotificationCount,
//   markNotificationAsRead,
//   markAllNotificationsAsRead,
};