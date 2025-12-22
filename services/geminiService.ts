import { GoogleGenAI } from "@google/genai";
import { SupportedLanguage } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models
const MODEL_FAST = 'gemini-2.5-flash-lite-preview-02-05'; 
const MODEL_SMART = 'gemini-3-pro-preview';

/**
 * Simulates code execution using streaming for faster perceived speed.
 */
export const simulateCodeExecutionStream = async function* (code: string, language: SupportedLanguage) {
  if (!code.trim()) {
    yield "";
    return;
  }

  if (language === SupportedLanguage.HTML) {
    yield "Rendering HTML Preview...";
    return;
  }

  const prompt = `Act as a precise ${language} compiler/interpreter.
Execute the following code and return ONLY the textual output (stdout).
If there is a compilation or runtime error, return the error message exactly as the compiler/interpreter would.
Do not add any markdown formatting like \`\`\` or explanations outside the output.

Code:
${code}`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: MODEL_FAST,
      contents: prompt,
    });

    for await (const chunk of responseStream) {
      yield chunk.text || "";
    }
  } catch (error) {
    console.error("Gemini Simulation Error:", error);
    yield "Error: Unable to simulate execution at this time.";
  }
};

/**
 * Legacy non-streaming simulation (kept for compatibility if needed)
 */
export const simulateCodeExecution = async (code: string, language: SupportedLanguage): Promise<string> => {
    let output = "";
    const stream = simulateCodeExecutionStream(code, language);
    for await (const chunk of stream) {
        output += chunk;
    }
    return output;
};

/**
 * Generates an explanation. 
 */
export const explainCodeLogic = async (code: string, language: SupportedLanguage, useThinking = false): Promise<string> => {
  if (!code.trim()) return "Write some code to get started!";

  const prompt = `Analyze the following ${language} code. 
Explain how it works step-by-step in a clear, simple, and encouraging manner suitable for a COMPLETE BEGINNER.

Guidelines:
1. Use simple English and avoid complex jargon.
2. If a technical term is needed, explain it briefly.
3. Use analogies if helpful.
4. Break it down logically.
5. Use Markdown formatting (bullet points, bold text) for readability.

Code:
${code}`;

  try {
    const config: any = {
      systemInstruction: "You are a friendly coding tutor for beginners.",
    };

    if (useThinking) {
      config.thinkingConfig = { thinkingBudget: 32768 }; 
    }

    const response = await ai.models.generateContent({
      model: useThinking ? MODEL_SMART : MODEL_FAST,
      contents: prompt,
      config: config
    });
    return response.text || "No explanation generated.";
  } catch (error) {
    console.error("Gemini Explanation Error:", error);
    return "Could not generate explanation.";
  }
};

/**
 * Provides intelligent code completion.
 */
export const getCodeSuggestions = async (code: string, language: SupportedLanguage): Promise<string> => {
  const prompt = `The user is writing ${language} code and might be stuck.

Current Code:
${code}

Provide a brief, helpful suggestion or hint.
- If code is incomplete, suggest the next lines.
- If code has potential bugs, politely point them out.
- Keep it short and easy to read.
- Format in Markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
    });
    return response.text || "No suggestions available.";
  } catch (error) {
    return "Unable to fetch suggestions.";
  }
};

/**
 * Autocomplete: Predicts the next snippet of code.
 */
export const getAutocompleteSuggestion = async (code: string, language: SupportedLanguage): Promise<string> => {
    // Only send the last 20 lines to keep context tight and fast
    const recentCode = code.split('\n').slice(-20).join('\n');
    const prompt = `Complete the following ${language} code. 
Return ONLY the completion code (next few tokens or lines). 
Do NOT repeat the input code. 
Do NOT wrap in markdown.
Stop at logical breaks.

Code:
${recentCode}`;
  
    try {
      const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
        config: {
            maxOutputTokens: 64, // Keep it short for "IntelliSense" feel
            stopSequences: ["\n\n"]
        }
      });
      return response.text?.trimEnd() || "";
    } catch (error) {
      return "";
    }
  };

/**
 * Fixes code errors.
 */
export const fixCodeError = async (code: string, error: string, language: SupportedLanguage): Promise<string> => {
    const prompt = `The following ${language} code produced an error.
  
  Error: ${error}
  
  Code:
  ${code}
  
  Fix the code to resolve the error. 
  Return ONLY the full corrected code. 
  Do not explain. 
  Do not wrap in markdown \`\`\`.`;
  
    try {
      const response = await ai.models.generateContent({
        model: MODEL_FAST, // Use fast model for quick fixes
        contents: prompt,
      });
      let fixed = response.text || code;
      return fixed.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '');
    } catch (e) {
      return code;
    }
};

/**
 * Analyze an image and generate code from it using Gemini 3 Pro.
 */
export const generateCodeFromImage = async (base64Image: string, language: SupportedLanguage): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_SMART, 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', 
              data: base64Image
            }
          },
          {
            text: `Analyze this image. If it contains code, transcribe it into ${language}. 
If it contains a diagram or a UI design, generate the ${language} code (or HTML/CSS) to implement it.
Return ONLY the code. Do not wrap it in markdown code blocks like \`\`\`.`
          }
        ]
      }
    });

    let code = response.text || "";
    code = code.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '');
    return code;
  } catch (error) {
    console.error("Image Analysis Error:", error);
    throw new Error("Failed to analyze image.");
  }
};

/**
 * Uses Gemini to format code.
 */
export const formatCodeWithAI = async (code: string, language: SupportedLanguage): Promise<string> => {
    const prompt = `You are a strict code formatter. 
Format the following ${language} code according to standard style guides.
Return ONLY the formatted code. No markdown backticks.

Code:
${code}`;
  
    try {
      const response = await ai.models.generateContent({
        model: MODEL_FAST,
        contents: prompt,
      });
      let formatted = response.text || code;
      if (formatted.startsWith('```')) {
          formatted = formatted.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
      }
      return formatted.trim();
    } catch (error) {
      console.error("Format Error", error);
      return code;
    }
  };