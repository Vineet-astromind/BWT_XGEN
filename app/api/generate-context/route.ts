import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    // 1. Grab the text that the user typed into the frontend box
    const body = await request.json();
    const userText = body.workspaceData;

    // 2. Make sure they actually sent something
    if (!userText) {
      return NextResponse.json(
        { error: "No workspace data provided." }, 
        { status: 400 }
      );
    }

    // 3. Setup Gemini
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    // 4. Send the user's actual text to the AI
    const prompt = `
      You are a work-life productivity assistant. Analyze the provided workspace data and reconstruct the user's context. 
      
      Workspace Data:
      ${userText}

      You must return a valid, strictly formatted JSON object with the following schema:
      {
        "lastKnownGoal": "A concise string stating the main objective",
        "completedSoFar": ["Array of 2-3 brief strings summarizing finished work"],
        "pendingTasks": ["Array of 2-3 brief strings listing unfinished tasks"],
        "keyDecisions": ["Array of strings highlighting assumptions or choices made"],
        "nextStep": "A single string suggesting the immediate next logical action",
        "references": ["Array of 2 strings suggesting helpful resources or document names"]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse the JSON returned by Gemini
    const contextData = JSON.parse(responseText);

    // Send it back to the frontend to display!
    return NextResponse.json(contextData);

  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate context summary." },
      { status: 500 }
    );
  }
}