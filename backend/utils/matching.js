// Calculate skill match score
exports.calculateMatchScore = (requiredSkills, candidateSkills) => {
  if (!requiredSkills || requiredSkills.length === 0) {
    return 0;
  }

  if (!candidateSkills || candidateSkills.length === 0) {
    return 0;
  }

  // Normalize skills to lowercase for comparison
  const normalizedRequired = requiredSkills.map(s => s.toLowerCase().trim());
  const normalizedCandidate = candidateSkills.map(s => s.toLowerCase().trim());

  // Count matching skills
  const matchingSkills = normalizedRequired.filter(skill => 
    normalizedCandidate.includes(skill)
  );

  // Calculate percentage
  const matchScore = Math.round((matchingSkills.length / normalizedRequired.length) * 100);

  return matchScore;
};

// Get matched and missing skills
exports.getSkillsBreakdown = (requiredSkills, candidateSkills) => {
  const normalizedRequired = requiredSkills.map(s => s.toLowerCase().trim());
  const normalizedCandidate = candidateSkills.map(s => s.toLowerCase().trim());

  const matched = requiredSkills.filter(skill => 
    normalizedCandidate.includes(skill.toLowerCase().trim())
  );

  const missing = requiredSkills.filter(skill => 
    !normalizedCandidate.includes(skill.toLowerCase().trim())
  );

  return { matched, missing };
};
