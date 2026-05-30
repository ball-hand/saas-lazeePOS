// backend/middleware/emailVerification.js
import { sendVerificationEmail } from '../utils/mailer.js';
import redis from '../utils/redis.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate and send email verification link
 */
export const sendVerificationLink = async (user) => {
  try {
    const verificationToken = uuidv4();

    // Store verification token in Redis (valid for 24 hours)
    const redisKey = `email_verify:${verificationToken}`;
    await redis.safeSetex(
      redisKey,
      24 * 60 * 60,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString(),
      })
    );

    // Build verification link
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, verificationLink);

    return emailSent ? verificationToken : null;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return null;
  }
};

/**
 * Verify email token and mark user as verified
 */
export const verifyEmailToken = async (token, prisma) => {
  try {
    const redisKey = `email_verify:${token}`;
    const tokenData = await redis.safeGet(redisKey);

    if (!tokenData) {
      return {
        success: false,
        message: 'Token verifikasi tidak valid atau sudah kadaluarsa.',
      };
    }

    const { userId } = JSON.parse(tokenData);

    // Mark user as verified
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    // Delete token from Redis
    await redis.safeDel(redisKey);

    return {
      success: true,
      message: 'Email berhasil diverifikasi!',
      user,
    };
  } catch (error) {
    console.error('Error verifying email token:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat memverifikasi email.',
    };
  }
};

export default {
  sendVerificationLink,
  verifyEmailToken,
};
