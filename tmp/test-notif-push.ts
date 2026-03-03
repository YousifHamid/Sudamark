import { sendPushNotification } from "../server/routes";

// Wait, I can't import sendPushNotification because it's not exported from routes.ts
// I'll just copy the function here to test it.
async function sendPushNotificationTest(expoPushTokens: string[], title: string, body: string, data: any = {}) {
    const messages = expoPushTokens.map(token => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
    }));

    try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });
        console.log("Fetch response status:", response.status);
        return await response.json();
    } catch (error) {
        console.error('Error sending push notification:', error);
        return null;
    }
}

async function run() {
    console.log("Sending...");
    // Put a valid or invalid token
    const res = await sendPushNotificationTest(["ExponentPushToken[invalid]"], "Test", "Test body");
    console.log("Result:", res);
}
run();
