// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Mongoose Schema
const FormSchema = new mongoose.Schema({
  orderType: String,
  pocPeriod: String,
  siteName: String,
  siteAddress: String,
  jobWork: String,
  installationDate: String,
  item1: String,
  qty1: String,
  item2: String,
  qty2: String,
  item3: String,
  qty3: String
});
const FormSubmission = mongoose.model('Submission', FormSchema);

// Routes
app.get('/get-email', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'email.html'));
});

app.post('/send-form-link', (req, res) => {
  const userEmail = req.body.email;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Fill the DI-HMS Form',
    html: `
      <p>Dear Customer,</p>
      <p>Please click the link below to fill out your installation requirement form:</p>
      <a href="${process.env.APP_URL}/">Click here to open the form</a>
      <p>Thank you!</p>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('❌ Email Error:', err);
      return res.send(`<script>alert("❌ Failed to send the email. Please try again."); window.location.href = "/get-email";</script>`);
    }
    console.log('✅ Form link sent:', info.response);
    res.send(`<script>alert("✅ Link has been sent to the customer’s email."); window.location.href = "/get-email";</script>`);
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

app.post('/submit', (req, res) => {
  const formData = req.body;
  const newSubmission = new FormSubmission(formData);

  newSubmission.save()
    .then(() => console.log('✅ Data saved to MongoDB'))
    .catch(err => console.error('❌ MongoDB save error:', err));

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'sahilmaurya1606@gmail.com',
    cc: ['nk6395213@gmail.com', 'katiyarkhushi309@gmail.com'],
    subject: 'DI-HMS Form Submission',
    html: `
      <h2>New Form Submitted</h2>
      <table border="1">
        <tr><th>Order Type</th><td>${formData.orderType}</td></tr>
        <tr><th>POC Period</th><td>${formData.pocPeriod}</td></tr>
        <tr><th>Site Name</th><td>${formData.siteName}</td></tr>
        <tr><th>Site Address</th><td>${formData.siteAddress}</td></tr>
        <tr><th>Job Work</th><td>${formData.jobWork}</td></tr>
        <tr><th>Installation Date</th><td>${formData.installationDate}</td></tr>
      </table>
      <h3>Requirements:</h3>
      <table border="1">
        <tr><th>Item</th><th>Quantity</th></tr>
        <tr><td>${formData.item1}</td><td>${formData.qty1}</td></tr>
        <tr><td>${formData.item2}</td><td>${formData.qty2}</td></tr>
        <tr><td>${formData.item3}</td><td>${formData.qty3}</td></tr>
      </table>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('❌ Email error:', err);
      res.send('❌ Email failed. Check logs.');
    } else {
      console.log('✅ Email sent:', info.response);
      res.send('✅ Form submitted and email sent successfully!');
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
