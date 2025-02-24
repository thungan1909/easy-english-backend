const fs = require('fs');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const readline = require('readline');
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const TOKEN_PATH = 'token.json';
const CREDENTIALS_PATH = 'credentials.json';
// let oAuth2Client;

let oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

function authorize() {
    fs.readFile(CREDENTIALS_PATH, (err, content) => {
        if (err) return console.error('Error loading client secret file:', err);

        const credentials = JSON.parse(content);

        const { client_secret, client_id, redirect_uris } = credentials.web;
        oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        // Read token from file if available
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getAccessToken(oAuth2Client);
            oAuth2Client.setCredentials(JSON.parse(token));
            sendEmail(oAuth2Client);
        });
    });
}

function getAccessToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from that page here: ', async (code) => {
        rl.close();
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), (err) => {
            if (err) return console.error('Error storing token', err);
            console.log('Token stored to', TOKEN_PATH);
        });
        sendEmail(oAuth2Client); // Call sendEmail after getting the token
    });
}

// Send email
async function sendEmail(auth) {
    const accessToken = await auth.getAccessToken();

    console.log("accessToken", accessToken)

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.EMAIL_USER,
            clientId: credentials.web.client_id,
            clientSecret: credentials.web.client_secret,
            refreshToken: process.env.REFRESH_TOKEN,
            accessToken: accessToken.token,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'recipient_email@gmail.com',
        subject: 'Test Email',
        text: 'Hello from Nodemailer using Gmail API!',
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = { authorize };
