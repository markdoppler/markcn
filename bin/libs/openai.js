import OpenAI from "openai";
import { getEnvVariable } from "../util/util.js";

export default async function initOpenAI() {

    const { value, error } = await getEnvVariable("MARKCN_OPENAI_API_KEY");

    const openai = new OpenAI({
        apiKey: value
    });

    return openai;

}
