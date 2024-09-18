const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Added for secure password hashing
const { User } = require('../models');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const moment = require('moment-timezone');
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'Adresse e-mail non trouvée' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    const accessToken = jwt.sign({ id: user.id }, 'your_access_token_secret');// Consider adding expiration for refresh tokens

    res.status(200).json({ accessToken, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};
exports.forgotPassword=async (req,res)=>{
   try{
        const user = await User.findOne({ where: { email: req.body.email } });
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiration = Date.now() + 3600000; // 1 hour
        const formattedExpiration = moment(resetTokenExpiration).tz('GMT').add(1, 'hours').format();
        // Save token and expiration in the database
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = formattedExpiration;
        await user.save();

       
        const resetUrl = `http://localhost:8080/reset-password/${resetToken}`;
  const sendEmail=async (options)=>{
    const transporter=nodemailer.createTransport({
        host:'sandbox.smtp.mailtrap.io',
        port:'2525',
        auth:{
            user:'4b9c2988a11fd7',
            pass:'2185a41c395337'
        },
    })
    const emailOptions={
        from:'test0@test.com',
        to:options.email,
        subject: 'Password Reset',
        text:`You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
                  `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                  `${resetUrl}\n\n` +
                  `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
     }
    await transporter.sendMail(emailOptions)
 }
  await sendEmail({
    email:user.email,
    subject: 'Password Reset',
    message:`You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
                  `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                  `${resetUrl}\n\n` +
                  `If you did not request this, please ignore this email and your password will remain unchanged.\n`,
  });
  res.status(200).json({'message':'Password reset token sent to email'});
} catch (error) {
    res.status(500).json({'message':'error reseting'});
}
} 
exports.resetPassword = async (req, res) => {
  try {
    const adjustedDate = moment().tz('GMT').add(1, 'hours').toDate();
    const user = await User.findOne({
      where: {
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { [Op.gt]: adjustedDate },
      },
    });

    if (!user) {
      return res.status(400).send('Password reset token is invalid or has expired');
    }

    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).send('Password must be at least 8 characters long');
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).send('Password has been reset');
  } catch (error) {
    res.status(500).send(error);
    console.log(error);
  }
};