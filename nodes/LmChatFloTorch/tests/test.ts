import { FloTorchLlm, Message, Messages } from "../utils/FloTorchLLM";

async function run() {
    const apiKey = "sk_kEKzE6jrtujJaco4MsS67U8H3D8UGvJQVQtJ6EbVASI=_OGQyODIyOWMtMTcxNC00NDM3LThlNWItNGFkZWU3MWRhMTRm_ZTFhOGNhNTgtNWY2ZS00ZTYwLWE3YzMtZTdmOTEyMTBjYzk3"; // replace with your actual key
    const client = new FloTorchLlm(apiKey);

    const message: Message = {
        role: 'user',
        content: 'Hello! How are you?'
    }
    const messages: Messages = [message]
    const model = 'flotorch/default'
    
    try {
        const output = await client.invoke(model, messages);
        console.log("Chat response:", output);
    } catch (err) {
        console.error("Failed to get chat response:", err);
    }
}

run();