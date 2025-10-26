import { GoogleGenAI, Type } from "@google/genai";
import { StructuredPrompt, AnalysisResult, PromptVariation } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const imageBytes = response?.generatedImages?.[0]?.image?.imageBytes;

    if (imageBytes) {
      return `data:image/jpeg;base64,${imageBytes}`;
    }
    
    throw new Error("No image was generated. The prompt may have been blocked for safety reasons. Please adjust your prompt.");
  } catch (error) {
    console.error("Error generating image:", error);
    if (error instanceof Error) {
        throw error; // Rethrow if it's already an Error object (like our custom one)
    }
    throw new Error("An unexpected error occurred during image generation.");
  }
}

const deconstructionSchema = {
  type: Type.OBJECT,
  properties: {
    frame: {
      type: Type.OBJECT,
      properties: {
        style: { type: Type.STRING, description: "The overall artistic style, genre, or medium. E.g., 'Photorealistic photo', '3D render', 'Political cartoon'." },
        tone: { type: Type.STRING, description: "A comma-separated list of tags describing the mood, tone, or feeling. E.g., 'Satirical, Humorous', 'Epic, Somber'." }
      },
      required: ['style', 'tone']
    },
    scene: {
      type: Type.OBJECT,
      properties: {
        subjects: {
          type: Type.ARRAY,
          description: "A list of the main subjects or characters.",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "The name of the subject. E.g., 'Donald Trump', 'a robot'." },
              attribute: { type: Type.STRING, description: "How the subject is portrayed or their role. E.g., 'as a petulant child', 'with a jetpack'." }
            },
            required: ['name', 'attribute']
          }
        },
        action: { type: Type.STRING, description: "The primary action or process taking place. E.g., 'is disciplining', 'sits on a throne'." }
      },
      required: ['subjects', 'action']
    },
    context: {
      type: Type.OBJECT,
      properties: {
        setting: { type: Type.STRING, description: "The location or setting of the scene. E.g., 'on the White House lawn', 'in a cyberpunk city'." },
        details: { type: Type.STRING, description: "A comma-separated list of key objects, props, or other important details. E.g., 'a broken gavel', 'lens flare'." }
      },
      required: ['setting', 'details']
    }
  },
  required: ['frame', 'scene', 'context']
};

export async function deconstructPrompt(rawPrompt: string): Promise<StructuredPrompt> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Deconstruct the following image generation prompt: "${rawPrompt}"`,
      config: {
        systemInstruction: "You are an expert at analyzing image generation prompts. Your task is to deconstruct a user-provided prompt into a structured JSON format based on Systemic Functional Linguistics (SFL) principles. Adhere strictly to the provided JSON schema. If a field is not present in the prompt, provide a reasonable empty or default value.",
        responseMimeType: "application/json",
        responseSchema: deconstructionSchema
      },
    });

    const jsonString = response.text.trim();
    const parsed = JSON.parse(jsonString);

    // Ensure subjects is always an array, even if the model returns null or is missing.
    if (!parsed.scene.subjects || !Array.isArray(parsed.scene.subjects)) {
        parsed.scene.subjects = [{ name: '', attribute: '' }];
    }
    if(parsed.scene.subjects.length === 0){
        parsed.scene.subjects.push({ name: '', attribute: '' });
    }

    return parsed as StructuredPrompt;
  } catch (error) {
    console.error("Error deconstructing prompt:", error);
    throw new Error("Failed to deconstruct prompt. Please check the console for details.");
  }
}


const analysisAndRewriteSchema = {
    type: Type.OBJECT,
    properties: {
        analysis: {
            type: Type.ARRAY,
            description: "A list of tags analyzing the prompt's components.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique ID for the tag, e.g., 'ent-1'." },
                    category: { type: Type.STRING, description: "The tag category: 'entity', 'process', 'tone', 'risk', or 'other'." },
                    span: { type: Type.STRING, description: "The specific text from the prompt being analyzed." },
                    detail: { type: Type.STRING, description: "A brief explanation of the analysis." },
                    weight: { type: Type.NUMBER, description: "A severity score from 0.0 to 1.0, especially for risks." }
                },
                required: ['id', 'category', 'span']
            }
        },
        candidates: {
            type: Type.ARRAY,
            description: "A list of suggested rewrite candidates for the prompt.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique ID for the candidate, e.g., 'rewrite-1'." },
                    title: { type: Type.STRING, description: "A short, descriptive title for the rewrite." },
                    text: { type: Type.STRING, description: "The full text of the rewritten prompt." },
                    rationale: { type: Type.STRING, description: "The reason this rewrite is being suggested." },
                    score: { type: Type.NUMBER, description: "A confidence score from 0.0 to 1.0 for the quality of the rewrite." }
                },
                required: ['id', 'title', 'text']
            }
        }
    },
    required: ['analysis', 'candidates']
};

export async function analyzeAndRewritePrompt(rawPrompt: string): Promise<AnalysisResult> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze and rewrite the following prompt: "${rawPrompt}"`,
            config: {
                systemInstruction: "You are a prompt analysis expert specializing in identifying sensitive content and improving prompts for image generation. Analyze the user's prompt based on Systemic Functional Linguistics (SFL) principles, identifying entities, processes, and potential policy risks. Then, generate several alternative prompts that are safer, more creative, or stylistically different. Adhere strictly to the provided JSON schema.",
                responseMimeType: "application/json",
                responseSchema: analysisAndRewriteSchema,
            },
        });

        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString);
        return parsed as AnalysisResult;

    } catch (error) {
        console.error("Error analyzing and rewriting prompt:", error);
        throw new Error("Failed to analyze and rewrite prompt. Please check the console for details.");
    }
}


const variationsSchema = {
    type: Type.OBJECT,
    properties: {
      variations: {
        type: Type.ARRAY,
        description: "A list of 3-4 creative prompt variations.",
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "A unique ID for the variation, e.g., 'var-1'." },
            title: { type: Type.STRING, description: "A short, descriptive title for the variation, highlighting the change." },
            prompt: { type: Type.STRING, description: "The full text of the prompt variation." }
          },
          required: ['id', 'title', 'prompt']
        }
      }
    },
    required: ['variations']
};
  
export async function generatePromptVariations(rawPrompt: string): Promise<PromptVariation[]> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate creative variations for this image prompt: "${rawPrompt}"`,
            config: {
                systemInstruction: "You are a creative assistant for an image generation tool. Given a prompt, your job is to generate 3-4 distinct and creative variations. The variations should explore different artistic styles, moods, compositions, or subject interpretations while retaining the core subject matter. Adhere strictly to the provided JSON schema.",
                responseMimeType: "application/json",
                responseSchema: variationsSchema
            },
        });

        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString);
        return (parsed.variations || []) as PromptVariation[];

    } catch (error) {
        console.error("Error generating prompt variations:", error);
        throw new Error("Failed to generate prompt variations. Please check the console for details.");
    }
}