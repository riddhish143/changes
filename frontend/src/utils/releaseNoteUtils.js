/**
 * Utility functions for release note extraction and processing
 */

/**
 * Extract release note from issue body
 * @param {string} body - The issue body text
 * @returns {string} - Formatted release note
 */
export const extractReleaseNote = (body) => {
  if (!body) {
    return '[ADDED]\n- [General]\n     - [Other] \n        - No release note available';
  }

  // Helper function to clean and normalize text while preserving links and references
  const cleanText = (text) => {
    if (!text) return '';
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\n\s*\n/g, '\n')  // Remove multiple blank lines
      .trim();
  };

  // Helper function to validate category format
  const validateCategoryFormat = (type, component, category, description) => {
    const validTypes = ['ADDED', 'CHANGED', 'DEPRECATED', 'REMOVED', 'FIXED', 'SECURITY'];
    
    // Default values
    const defaultType = 'ADDED';
    const defaultComponent = 'General';
    const defaultCategory = 'Other';
    
    // Validate and normalize type
    type = type ? type.trim().toUpperCase() : defaultType;
    type = validTypes.includes(type) ? type : defaultType;
    
    // Validate and normalize component and category
    component = component ? cleanText(component) : defaultComponent;
    category = category ? cleanText(category) : defaultCategory;
    
    // Ensure description is not empty but preserve all formatting
    description = cleanText(description);
    if (!description) {
      description = 'No detailed description available';
    }
    
    return { type, component, category, description };
  };

  // Helper function to extract content between markdown sections
  const extractBetweenSections = (content, startPattern, endPattern) => {
    const start = content.search(startPattern);
    if (start === -1) return null;

    const remainingContent = content.slice(start);
    const end = endPattern ? remainingContent.search(endPattern) : -1;
    return end === -1 ? remainingContent : remainingContent.slice(0, end);
  };

  try {
    // Try to match the categorized format first
    const categoryPattern = /\[([^\]]+)\](?:\s*\n-\s*|\[)\[([^\]]+)\](?:\s*\n\s*-\s*|\[)\[([^\]]+)\](?:\s*\n\s*-\s*|\s+)([\s\S]*?)(?=(?:\s*\[(?:ADDED|CHANGED|DEPRECATED|REMOVED|FIXED|SECURITY)\]|\s*$))/gi;
    const matches = [...body.matchAll(categoryPattern)];
    
    if (matches.length > 0) {
      // Handle multiple categorized notes if present
      const formattedNotes = matches.map(match => {
        const [, type, component, category, description] = match;
        const validated = validateCategoryFormat(type, component, category, description);
        return `[${validated.type}]\n- [${validated.component}]\n     - [${validated.category}] \n        - ${validated.description}`;
      }).filter(Boolean);

      if (formattedNotes.length > 0) {
        return formattedNotes.join('\n\n');
      }
    }

    // Fallback patterns in order of preference
    const fallbackPatterns = [
      {
        section: /###\s*Release\s*Notes?\s*(?:\(.*?\))?\s*\n/i,
        end: /\n###|\n##|\n#|$/
      },
      {
        section: /##\s*Release\s*Notes?\s*(?:\(.*?\))?\s*\n/i,
        end: /\n##|\n#|$/
      },
      {
        section: /Release\s*Notes?\s*:\s*/i,
        end: /\n#|$/
      },
      {
        section: /```\s*release-note\s*\n/i,
        end: /```/
      }
    ];

    for (const pattern of fallbackPatterns) {
      const content = extractBetweenSections(body, pattern.section, pattern.end);
      if (content) {
        const cleanedContent = cleanText(content.replace(pattern.section, ''));
        if (cleanedContent) {
          // Try to parse any category-like format in the content
          const categoryMatch = cleanedContent.match(/^\s*\[([^\]]+)\]\s*(?:\[([^\]]+)\])?\s*(?:\[([^\]]+)\])?\s*([\s\S]*)/);
          if (categoryMatch) {
            const [, type, component, category, desc] = categoryMatch;
            const validated = validateCategoryFormat(type, component, category, desc);
            return `[${validated.type}]\n- [${validated.component}]\n     - [${validated.category}] \n        - ${validated.description}`;
          }
          // If no category format found, wrap it in the default structure
          return `[ADDED]\n- [General]\n     - [Other] \n        - ${cleanedContent}`;
        }
      }
    }

    // Last resort: Try to find any content that looks like a release note
    const anyNotePattern = /(?:release note|changelog|changes?)(?:\s*:|>|\n)\s*([\s\S]+?)(?=\n#|$)/i;
    const lastResortMatch = body.match(anyNotePattern);
    if (lastResortMatch && lastResortMatch[1]) {
      const content = cleanText(lastResortMatch[1]);
      return `[ADDED]\n- [General]\n     - [Other] \n        - ${content}`;
    }

    return `[ADDED]\n- [General]\n     - [Other] \n        - No release note section found`;
  } catch (error) {
    console.error('Error extracting release note:', error);
    return `[ADDED]\n- [General]\n     - [Other] \n        - Error extracting release note`;
  }
};

/**
 * Extract issue and PR links from content
 * @param {string} content - The content to extract links from
 * @returns {Object} - Object containing issue and PR links
 */
export const extractIssueAndPRLinks = (content) => {
  if (!content) return { issueLink: null, prLinks: [] };
  
  let issueLink = null;
  let issueNumber = null;
  let prLinks = [];
  
  // Check for markdown link format: [#4029](https://github.ibm.com/...)
  const markdownIssueMatch = content.match(/Issue\s+\[#(\d+)\]\((https:\/\/[^\s)]+)\)/i);
  if (markdownIssueMatch) {
    issueNumber = markdownIssueMatch[1];
    issueLink = markdownIssueMatch[2];
  } else {
    // Check for plain URL format: Issue https://github.ibm.com/...
    const plainIssueMatch = content.match(/Issue\s+(https:\/\/[^\s:)]+)/i);
    if (plainIssueMatch) {
      issueLink = plainIssueMatch[1];
      // Extract issue number from URL
      const issueNumberMatch = issueLink.match(/\/issues\/(\d+)/);
      issueNumber = issueNumberMatch ? issueNumberMatch[1] : null;
    }
  }
  
  // Find all PR links in format: PR #123, #456
  const prNumberPattern = /PR\s+(?:#(\d+)(?:,\s*#(\d+))*)|\bPR\s+#(\d+)(?:,\s*#(\d+))*\b/gi;
  const prDirectPattern = /PR\s+(https:\/\/[^\s)]+)/gi;
  
  // First try to find all direct PR links
  let directMatches;
  while ((directMatches = prDirectPattern.exec(content)) !== null) {
    const prLink = directMatches[1];
    if (prLink && !prLinks.includes(prLink)) {
      prLinks.push(prLink);
    }
  }
  
  // Then find all PR numbers
  let matches;
  while ((matches = prNumberPattern.exec(content)) !== null) {
    // Process all numbers found in this match
    const allNumbers = matches[0].match(/#(\d+)/g);
    
    if (allNumbers) {
      allNumbers.forEach(numMatch => {
        const prNumber = numMatch.substring(1); // Remove the # character
        
        // Only create links if we don't already have a direct link for this PR
        const existingPRLink = prLinks.find(link => link.includes(`/pull/${prNumber}`));
        if (!existingPRLink && issueLink) {
          // Extract base URL from issue link
          const baseUrl = issueLink.match(/(https:\/\/[^\/]+\/[^\/]+\/[^\/]+)/);
          if (baseUrl) {
            const constructedLink = `${baseUrl[1]}/pull/${prNumber}`;
            if (!prLinks.includes(constructedLink)) {
              prLinks.push(constructedLink);
            }
          }
        }
      });
    }
  }
  
  return { issueLink, prLinks, issueNumber };
};

/**
 * Extract PR number from content
 * @param {string} content - The content to extract PR number from
 * @returns {string} - PR number or 'N/A'
 */
export const extractPRNumber = (content) => {
  if (!content) return 'N/A';
  
  // Match PR #number pattern
  const prMatch = content.match(/PR\s*#(\d+)/i);
  return prMatch ? prMatch[1] : 'N/A';
};

/**
 * Find release note section in issue body
 * @param {string} body - The issue body
 * @returns {Object|null} - Object with start, end, and header properties
 */
export const findReleaseNoteSection = (body) => {
  // Look specifically for the Release Note section with proper markdown heading
  const releaseNotePattern = /^##\s*Release\s*Note\s*$/im;
  const match = body.match(releaseNotePattern);
  
  if (match) {
    const startIndex = match.index;
    const header = match[0];
    
    // Find the next section that starts with ## or --- or end of content
    const remainingContent = body.slice(startIndex + header.length);
    const nextSectionMatch = remainingContent.match(/\n(?:##[^#]|---|$)/);
    
    const endIndex = nextSectionMatch 
      ? startIndex + header.length + nextSectionMatch.index
      : body.length;

    return {
      start: startIndex,
      end: endIndex,
      header: header
    };
  }
  return null;
}; 