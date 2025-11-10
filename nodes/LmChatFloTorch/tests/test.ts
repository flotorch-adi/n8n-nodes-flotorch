import { FloTorchLLM } from "../../../utils/FloTorchLLM";
import { FloTorchMessage } from "../../../utils/FloTorchUtils";

async function run() {
    const model = 'flotorch/default'
    const apiKey = "sk_kEKzE6jrtujJaco4MsS67U8H3D8UGvJQVQtJ6EbVASI=_OGQyODIyOWMtMTcxNC00NDM3LThlNWItNGFkZWU3MWRhMTRm_ZTFhOGNhNTgtNWY2ZS00ZTYwLWE3YzMtZTdmOTEyMTBjYzk3";
    const client = new FloTorchLLM(model, apiKey);

    const message: FloTorchMessage = {
        role: 'user',
        content: 'Hello! How are you?'
    }
    const messages: FloTorchMessage[] = [message]
    
    try {
        const output = await client.invoke(messages);
        console.log("Chat response:", output);
    } catch (err) {
        console.error("Failed to get chat response:", err);
    }
}

run();