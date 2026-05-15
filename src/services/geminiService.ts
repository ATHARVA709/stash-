import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AIProcessedItem {
  title: string;
  summary: string;
  categories: string[];
  tags: string[];
  type: 'website' | 'app' | 'tool' | 'resource' | 'link' | 'idea' | 'note' | 'video';
  previewImageUrl?: string;
  faviconUrl?: string;
}

export async function processItem(content: string, note?: string): Promise<AIProcessedItem> {
  const prompt = `
    Analyze the following input and generate structured information for a personal library app named "Stash".
    Input: "${content}"
    User Note: "${note || "None"}"

    Rules:
    1. Extract a clear, concise title.
    2. Generate a short, useful summary (max 2 sentences).
    3. Suggest at least 2-3 categories (e.g., Coding, Finance, Design, AI Tools, Scholarships, Learning).
    4. Provide relevant tags.
    5. Determine the item type.
    
    Return the response ONLY as a JSON object with the following structure:
    {
      "title": "Title here",
      "summary": "Summary here",
      "categories": ["Category 1", "Category 2"],
      "tags": ["tag1", "tag2"],
      "type": "website | app | tool | resource | link | idea | note | video"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    const text = response.text || "";
    
    // Clean up potential markdown formatting in text
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Processing failed:", error);
    // Fallback
    return {
      title: content.slice(0, 50),
      summary: "Processed without AI details.",
      categories: ["Uncategorized"],
      tags: [],
      type: content.startsWith('http') ? 'website' : 'note'
    };
  }
}

export async function semanticSearch(items: any[], query: string) {
  const itemsList = items.map(item => ({
    id: item.id,
    title: item.title,
    summary: item.aiSummary,
    note: item.note,
    categories: item.categories,
    tags: item.tags
  }));

  const prompt = `
    Given a list of items and a search query, return the IDs of the items that most closely match the query semantically.
    Query: "${query}"
    Items: ${JSON.stringify(itemsList)}

    Return ONLY an array of item IDs in order of relevance, as JSON.
    Example: ["id1", "id2"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    const text = response.text || "";
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Semantic search failed:", error);
    return [];
  }
}
