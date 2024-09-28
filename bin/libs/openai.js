import OpenAI from "openai";
import { getEnvVariable } from "../util/util.js";

export default async function initOpenAI() {

    const openai = new OpenAI({
        apiKey: await getEnvVariable("OPENAI_API_KEY")
    });

    return openai;

}
