import bcrypt from "bcryptjs";
import { Role } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";

export const seedTesterAdmin = async () => {
	try {
		const name = config.tester_admin_name;
		const email = config.tester_admin_email;
		const password = config.tester_admin_password;

		if (!name || !email || !password) {
			throw new Error(
				"Tester Admin Name, Email, or Password is missing in the ENV file!!!",
			);
		}

		const isTesterAdminExist = await prisma.user.findUnique({
			where: {
				email,
			},
		});

		if (isTesterAdminExist) {
			console.log("Tester Admin Already Exists!");
			return;
		}

		const hashedPassword = await bcrypt.hash(
			password,
			Number(config.bcrypt_salt_rounds),
		);

		const testerAdmin = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: Role.ADMIN,
				emailVerified: true,
				isActive: true,
			},
		});

		console.log("Tester Admin Created:", testerAdmin.email);
	} catch (error) {
		console.log("Error Seeding Tester Admin:", error);
	}
};
