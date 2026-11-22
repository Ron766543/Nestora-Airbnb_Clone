export const generateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
}

export const generateOtpHtml = (otp) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 50px auto;
            background-color: #fff;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
      .otp{
        font-size: 24px;
        font-weight: bold;
        color: #333;
      }
    </style>
        
        </style>
</head>
<body>
    <h2>OTP Verification</h2>
    <p>Your OTP is: <strong class="otp" >${otp}</strong></p>
    <p>Please enter this code to verify your email address.</p>
</body>
</html>`;
}