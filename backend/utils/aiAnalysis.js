const { getGeminiModel } = require('../config/gemini');

exports.analyzeInterview = async (transcript, jobDescription, requiredSkills) => {
  try {
    const model = getGeminiModel();

    const prompt = `
Analyze the following job interview transcript and provide a detailed evaluation:

JOB DESCRIPTION:
${jobDescription}

REQUIRED SKILLS:
${requiredSkills.join(', ')}

INTERVIEW TRANSCRIPT:
${transcript}

Please analyze this interview and return your evaluation in the following JSON format:
{
  "decision": "Yes" or "No" or "Maybe",
  "score": 0-100,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendation": "Brief final recommendation in 2-3 sentences"
}

Evaluate based on:
1. Relevance of candidate's answers to job requirements
2. Communication skills and clarity
3. Technical knowledge and experience
4. Problem-solving abilities
5. Cultural fit and motivation

Return ONLY valid JSON, no additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
    const analysis = JSON.parse(cleanedText);

    return {
      success: true,
      analysis: {
        decision: analysis.decision || 'Maybe',
        score: analysis.score || 50,
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        recommendation: analysis.recommendation || 'Further evaluation needed'
      }
    };

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      success: false,
      error: error.message,
      analysis: {
        decision: 'Pending',
        score: 0,
        strengths: [],
        weaknesses: [],
        recommendation: 'Analysis failed, manual review required'
      }
    };
  }
};
