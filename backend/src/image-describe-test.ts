import { loadImage, describeWithOpenAI, describeImage } from "./services/image-description";
import { DESCRIBE_IMAGES_PROMPT, OPENAI_API_KEY } from "./config";

(async () => {
    console.log(await describeImage("d:/avatar.jpg"));
})();
