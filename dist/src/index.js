import "dotenv/config";
import { run } from "@xmtp/botkit";
import { contentFilter } from "./lib/gpt.js";
import { postToFarcaster } from "./lib/neynar.js";
// Tracks conversation steps
const inMemoryCacheStep = new Map();
const inMemoryCacheMessage = new Map();
run(async (context) => {
    const { content, senderAddress } = context.message;
    const lowerContent = content.toLowerCase();
    // Handles unsubscribe and resets step
    const stopWords = ["stop", "unsubscribe", "cancel", "list"];
    if (stopWords.some((word) => lowerContent.includes(word))) {
        inMemoryCacheStep.set(senderAddress, 0);
    }
    const cacheStep = inMemoryCacheStep.get(senderAddress) || 0;
    let message = "";
    if (cacheStep === 0) {
        message =
            "Welcome to FarHackAnon! Type your message to cast an anonymous message on the profile https://warpcast.com/faranon.";
        inMemoryCacheStep.set(senderAddress, cacheStep + 1);
    }
    else if (cacheStep === 1) {
        // Call the OpenAI API to filter and process the message
        const response = await contentFilter(content);
        if (response.isOffensive) {
            message =
                "Your message contains inappropriate content and cannot be posted.";
        }
        else {
            message = `Your message is ready to post:\n\n"${content}"\n\nType 'post' to confirm or 'edit' to modify it.`;
            // Store the approved message temporarily
            inMemoryCacheStep.set(senderAddress, cacheStep + 1);
            inMemoryCacheMessage.set(senderAddress + "_message", content);
        }
    }
    else if (cacheStep === 2) {
        if (lowerContent === "post") {
            const cachedMessage = inMemoryCacheMessage.get(senderAddress + "_message");
            if (cachedMessage) {
                console.log("Send to fc", cachedMessage);
                const result = await postToFarcaster(cachedMessage);
                message = `Your message has been posted on Farcaster https://warpcast.com/faranon"`;
                inMemoryCacheStep.set(senderAddress, 0);
                inMemoryCacheMessage.delete(senderAddress + "_message");
            }
        }
        else if (lowerContent === "edit") {
            message = "Please type your new message:";
            inMemoryCacheStep.set(senderAddress, 1); // Go back to message editing step
        }
        else {
            message =
                "Invalid option. Type 'post' to confirm or 'edit' to modify your message.";
        }
    }
    else {
        message = "Invalid option. Please start again.";
        inMemoryCacheStep.set(senderAddress, 0);
    }
    // Send the message
    await context.reply(message);
});
//# sourceMappingURL=index.js.map