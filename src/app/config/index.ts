import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
	node_env: process.env.NODE_ENV,
	port: process.env.PORT,
	database_url: process.env.DATABASE_URL,
	bak_url: process.env.APP_URL,
	frontend_url: process.env.FRONTEND_URL,
	bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
	jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
	jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
	jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
	jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,
	google_client_id: process.env.GOOGLE_CLIENT_ID!,
	tester_admin_name: process.env.TESTER_ADMIN_NAME!,
	tester_admin_email: process.env.TESTER_ADMIN_EMAIL!,
	tester_admin_password: process.env.TESTER_ADMIN_PASSWORD!,
	redis_user: process.env.REDIS_USER!,
	redis_password: process.env.REDIS_PASSWORD!,
	redis_host: process.env.REDIS_HOST!,
	redis_port: process.env.REDIS_PORT!,
	smtp_password: process.env.SMTP_PASSWORD!,
	smtp_user: process.env.SMTP_USER!,
	email_sender: process.env.EMAIL_SENDER!,
	stripe_secret_key: process.env.STRIPE_SECRET_KEY!,
	stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET!,
	bkash_base_url : process.env.BKASH_BASE_URL!,
	bkash_username : process.env.BKASH_USERNAME!,
	bkash_password : process.env.BKASH_PASSWORD!,
	bkash_app_key : process.env.BKASH_APP_KEY!,
	bkash_app_secret : process.env.BKASH_APP_SECRET!,
	bkash_callback_url: process.env.BKASH_CALLBACK_URL!,
};
