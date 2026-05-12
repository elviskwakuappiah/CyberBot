
import { GoogleGenAI, Type } from "@google/genai";
import { LevelInfo } from "../types";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getStaticBriefing = (level: number): LevelInfo => {
  return {
    level,
    title: level === 30 ? "The Final Stand" : (level === 20 ? "Project Cyberrise" : (level === 5 ? "Tank-former Breach" : (level === 10 ? "Colossus Conflict" : `Sector ${level} Cleanup`))),
    description: level === 5 
        ? "Massive heavy-tread units have breached the outer wall. Mobilize the CyberBot squad to halt their advance." 
        : (level === 20 ? "The Rogue Core has manifested. This is the end of the line for humanity. Combine and conquer or fall forever." : (level === 30 ? "The ultimate machine intelligence is here. All sectors depend on this final mission." : "Scouts report rogue hardware active in this sector. Neutralize all targets to secure the area."))
  };
};

async function callGeminiWithRetry(level: number, specialPrompt: string, retries = 2): Promise<any> {
  const currentAttempt = 3 - retries;
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const isChapter2 = level > 20;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short mission briefing for Level ${level} of a game called CyberBot. 
      The CyberBots are specialized defenders protecting the planet from a rogue machine uprising.
      ${specialPrompt || "The goal is to destroy hostiles in the sector."}
      Provide a cool title and a 2-sentence description emphasizing the high-tech mechanical warfare.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.INTEGER },
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["level", "title", "description"]
        }
      }
    });
    
    if (!response.text) throw new Error("Empty response from AI");
    return JSON.parse(response.text);
  } catch (error: any) {
    const errorString = JSON.stringify(error).toLowerCase();
    const isQuotaError = 
      error?.status === 429 || 
      error?.message?.includes('429') || 
      errorString.includes('resource_exhausted') ||
      errorString.includes('quota');
    
    if (retries > 0 && isQuotaError) {
      const waitTime = Math.pow(2, currentAttempt) * 1000;
      await delay(waitTime);
      return callGeminiWithRetry(level, specialPrompt, retries - 1);
    }
    
    throw error;
  }
}

export const getLevelBriefing = async (level: number): Promise<LevelInfo> => {
  let specialPrompt = "";
  if (level === 5) specialPrompt = "BOSS ENCOUNTER: Scout Commander. A fast, agile machine that jumps and dashes. Watch out for its rapid-fire pulses.";
  if (level === 10) specialPrompt = "BOSS ENCOUNTER: Fortress Tank. A heavily armored behemoth with a main cannon and mortar fire. It's slow but incredibly durable.";
  if (level === 15) specialPrompt = "BOSS ENCOUNTER: Aerial Swarm Queen. A flying terror that spawns smaller drones and fires spreads of stingers from above.";
  if (level === 20) specialPrompt = "BOSS ENCOUNTER: Plasma Sentinel. A hovering energy-based guardian that fires plasma bursts and has a rotating shield.";
  if (level === 21) specialPrompt = "GIGANTIC TITAN ENCOUNTER. A massive machine is approaching. A specialized Space Ship is available in the sector. Press 'G' to enter the ship and use its high-output laser to destroy 25% of the Titan's integrity.";
  if (level === 22) specialPrompt = "RESCUE MISSION. The squad was destroyed by the Titan. You must deploy a single unit to recover the wreckage of your fallen comrades and bring them to the Rescue Ship.";
  if (level === 25) specialPrompt = "BOSS ENCOUNTER: Void Reaper. A stealthy assassin that can teleport and turn semi-transparent. It uses high-damage melee strikes.";
  if (level === 30) specialPrompt = "FINAL BOSS: Omega Annihilator. The ultimate machine intelligence. It uses annihilation beams and rains fire from the sky. This is the end of the line.";

  try {
    return await callGeminiWithRetry(level, specialPrompt);
  } catch (error: any) {
    console.warn("Gemini service unavailable, using local CyberBot data.", error.message || error);
    return getStaticBriefing(level);
  }
};
