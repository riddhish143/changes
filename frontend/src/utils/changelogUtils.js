/**
 * Utility functions for changelog generation
 */
import { extractIssueAndPRLinks } from './releaseNoteUtils';

/**
 * Process release notes for changelog generation
 * @param {Array} notes - Array of release notes
 * @param {Array} issues - Array of issues
 * @returns {Object} - Object containing processed notes and any errors
 */
export const processReleaseNotes = (notes, issues) => {
  const notesWithErrors = [];
  const allNotes = Object.entries(notes)
    .filter(([issueNumber, content]) => {
      const issue = issues.find(i => i.number.toString() === issueNumber);
      const isValid = content && content.trim() !== '' && issue;
      
      if (!isValid && issue) {
        notesWithErrors.push(`Issue #${issueNumber}: Missing or empty release note`);
      }
      return isValid;
    })
    .map(([issueNumber, content]) => {
      const issue = issues.find(i => i.number.toString() === issueNumber);
      return {
        issueNumber: issue.number,
        title: issue.title,
        content: content.trim()
      };
    });

  if (allNotes.length === 0) {
    const errorMessage = notesWithErrors.length > 0 
      ? `No valid release notes found. Issues with errors:\n${notesWithErrors.join('\n')}`
      : 'No release notes found to generate changelog';
    throw new Error(errorMessage);
  }

  return { allNotes, notesWithErrors };
};

/**
 * Extract and validate release note categories
 * @param {Array} allNotes - Array of processed notes
 * @returns {Object} - Object containing processed notes and invalid notes
 */
export const extractNoteCategories = (allNotes) => {
  const processedNotes = [];
  const invalidNotes = [];

  allNotes.forEach(note => {
    // Try to extract the basic structure: type, component, category, description
    let processed = false;
    
    // First, try to extract the type
    const typeMatch = note.content.match(/\[([^\]]+)\]/);
    if (typeMatch) {
      const type = typeMatch[1];
      const afterType = note.content.substring(note.content.indexOf(`[${type}]`) + type.length + 2);
      
      // Look for components
      const componentMatch = afterType.match(/\[([^\]]+)\]/);
      if (componentMatch) {
        const component = componentMatch[1];
        const afterComponent = afterType.substring(afterType.indexOf(`[${component}]`) + component.length + 2);
        
        // Look for categories
        const categoryMatch = afterComponent.match(/\[([^\]]+)\]/);
        if (categoryMatch) {
          const category = categoryMatch[1];
          const afterCategory = afterComponent.substring(afterComponent.indexOf(`[${category}]`) + category.length + 2);
          
          // Everything after the category is the description
          let description = afterCategory.trim();
          
          // If description is empty, try to find any text in the note
          if (!description) {
            // Extract any text that's not in brackets and not just whitespace or dashes
            const textMatch = note.content.match(/[^[\]\s-]+/g);
            if (textMatch && textMatch.length > 0) {
              description = textMatch.join(' ').trim();
            }
          }
          
          if (description) {
            processedNotes.push({
              type: type || 'Uncategorized',
              component: component || 'General',
              category: category || 'Other',
              description: description,
              issueNumber: note.issueNumber
            });
            processed = true;
          }
        }
      }
    }
    
    // If we couldn't process it with the simple approach, try the more complex patterns
    if (!processed) {
      // Check for format where component is directly in the description
      const componentInDescriptionMatch = note.content.match(/\[([^\]]+)\][\s\S]*?-\s*\[([^\]]+)\][\s\S]*?-\s*\[([^\]]+)\][\s\S]*?-\s*-\s*\[([^\]]+)\][\s\S]*?-\s*\[([^\]]+)\][\s\S]*?-\s*(.*)/s);
      
      if (componentInDescriptionMatch) {
        const [, type, , , actualComponent, actualCategory, description] = componentInDescriptionMatch;
        if (description && description.trim()) {
          processedNotes.push({
            type: type || 'Uncategorized',
            component: actualComponent || 'General',
            category: actualCategory || 'Other',
            description: description.trim(),
            issueNumber: note.issueNumber
          });
          processed = true;
        }
      }
      
      // Generic pattern for nested components and categories
      if (!processed) {
        const nestedComponentMatch = note.content.match(/\[([^\]]+)\][\s\S]*?-\s*\[([^\]]+)\][\s\S]*?-\s*\[([^\]]+)\][\s\S]*?-\s*-\s*\[([^\]]+)\][\s\S]*?-\s*\[([^\]]+)\][\s\S]*?-\s*(.*)/s);
        
        if (nestedComponentMatch) {
          const [, type, , , component, category, description] = nestedComponentMatch;
          if (description && description.trim()) {
            processedNotes.push({
              type: type || 'Uncategorized',
              component: component || 'General',
              category: category || 'Other',
              description: description.trim(),
              issueNumber: note.issueNumber
            });
            processed = true;
          }
        }
      }
      
      // If we get here, try to extract component and category from the description itself
      if (!processed) {
        const extractFromDescription = note.content.match(/\[([^\]]+)\][\s\S]*?-\s*\[([^\]]+)\][\s\S]*?-\s*\[([^\]]+)\][\s\S]*?-\s*(.*)/s);
        
        if (extractFromDescription) {
          const [, type, , , fullDescription] = extractFromDescription;
          
          // Look for any components in brackets in the description
          const componentMatch = fullDescription.match(/\[([^\]]+)\]/);
          if (componentMatch) {
            const component = componentMatch[1];
            
            // Try to find a category after this component
            const afterComponent = fullDescription.substring(fullDescription.indexOf(`[${component}]`) + component.length + 2);
            const categoryMatch = afterComponent.match(/\[([^\]]+)\]/);
            
            if (categoryMatch) {
              const category = categoryMatch[1];
              
              // Clean up the description by removing the component and category tags
              let cleanDescription = afterComponent;
              
              // Try to extract the actual description after the category
              const afterCategory = afterComponent.substring(afterComponent.indexOf(`[${category}]`) + category.length + 2);
              if (afterCategory && afterCategory.trim()) {
                cleanDescription = afterCategory.trim();
              } else {
                // If we can't find text after the category, use the full description
                cleanDescription = fullDescription.trim();
              }
              
              processedNotes.push({
                type: type || 'Uncategorized',
                component: component || 'General',
                category: category || 'Other',
                description: cleanDescription,
                issueNumber: note.issueNumber
              });
              processed = true;
            }
          }
          
          // Try to extract component and category from the description
          if (!processed) {
            const componentCategoryMatch = fullDescription.match(/\[([^\]]+)\][\s\S]*?-\s*\[([^\]]+)\][\s\S]*?-\s*(.*)/s);
            
            if (componentCategoryMatch) {
              const [, component, category, description] = componentCategoryMatch;
              if (description && description.trim()) {
                processedNotes.push({
                  type: type || 'Uncategorized',
                  component: component || 'General',
                  category: category || 'Other',
                  description: description.trim(),
                  issueNumber: note.issueNumber
                });
                processed = true;
              }
            }
          }
        }
      }
      
      // Last resort: if we have at least a type, try to extract any meaningful text
      if (!processed) {
        const typeOnlyMatch = note.content.match(/\[([^\]]+)\]([\s\S]*)/);
        if (typeOnlyMatch) {
          const [, type, rest] = typeOnlyMatch;
          
          // Extract any text that's not in brackets and not just whitespace or dashes
          const textMatch = rest.match(/[^[\]\s-]+/g);
          if (textMatch && textMatch.length > 0) {
            const description = textMatch.join(' ').trim();
            
            processedNotes.push({
              type: type || 'Uncategorized',
              component: 'General',
              category: 'Other',
              description: description,
              issueNumber: note.issueNumber
            });
            processed = true;
          }
        }
      }
    }
    
    if (!processed) {
      invalidNotes.push(`Issue #${note.issueNumber}: Could not extract a valid release note. Please ensure it has at least a type in brackets [TYPE] and some description text.`);
    }
  });

  if (processedNotes.length === 0) {
    const errorMessage = invalidNotes.length > 0
      ? `No valid release notes found. Format errors:\n${invalidNotes.join('\n')}`
      : 'No properly formatted release notes found';
    throw new Error(errorMessage);
  }

  return { processedNotes, invalidNotes };
};

/**
 * Group processed notes by type, component, and category
 * @param {Array} processedNotes - Array of processed notes
 * @returns {Object} - Grouped notes
 */
export const groupNotesByType = (processedNotes) => {
  const groupedByType = {};
  processedNotes.forEach(note => {
    const type = note.type;
    const component = note.component;
    
    if (!groupedByType[type]) {
      groupedByType[type] = {};
    }
    
    if (!groupedByType[type][component]) {
      groupedByType[type][component] = {};
    }
    
    if (!groupedByType[type][component][note.category]) {
      groupedByType[type][component][note.category] = new Set();
    }
    
    // Add description to Set to automatically remove duplicates
    groupedByType[type][component][note.category].add(note.description);
  });

  if (Object.keys(groupedByType).length === 0) {
    throw new Error('Failed to group release notes by type');
  }

  return groupedByType;
};

/**
 * Generate changelog content from grouped notes
 * @param {Object} groupedByType - Grouped notes
 * @param {string} milestoneName - Name of the milestone
 * @param {string} currentDate - Current date
 * @returns {string} - Generated changelog content
 */
export const generateChangelogContent = (groupedByType, milestoneName, currentDate, importantText, announcementText) => {
  const contentParts = [`# ${milestoneName}\n\n${currentDate}\n\n`];

  // Add important text to the content parts
  if (importantText) {
    contentParts.push(`#### _Important_ **\n - ${importantText}\n\n`);
  }

  // Add announcement text to the content parts 
  if (announcementText) {
    contentParts.push(`#### _Announcement_ **\n - ${announcementText}\n\n`);
  }
  
  contentParts.push(`\n\n## Changes\n\n`);
  // Define the order of types (ADDED first, FIXED second, rest alphabetically)
  const typeOrder = ['ADDED', 'FIXED'];
  const typeEntries = Object.entries(groupedByType);
  
  // Sort types according to our desired order
  typeEntries.sort(([typeA], [typeB]) => {
    const indexA = typeOrder.indexOf(typeA);
    const indexB = typeOrder.indexOf(typeB);
    
    // If both types are in our predefined order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only typeA is in our predefined order
    if (indexA !== -1) {
      return -1;
    }
    // If only typeB is in our predefined order
    if (indexB !== -1) {
      return 1;
    }
    // If neither is in our predefined order, sort alphabetically
    return typeA.localeCompare(typeB);
  });
  
  typeEntries.forEach(([type, components]) => {
    contentParts.push(`- [${type}]\n`);
    
    Object.entries(components).forEach(([component, categories]) => {
      contentParts.push(`  - **${component}**\n`);
      
      Object.entries(categories).forEach(([category, descriptions]) => {
        descriptions.forEach(description => {
          // Process the description to properly format issue and PR links
          let formattedDescription = description;
          
          // Extract issue and PR links
          const { issueLink, prLinks, issueNumber } = extractIssueAndPRLinks(description);
          
          // If we have issue and PR information, format it properly
          if (issueNumber && prLinks && prLinks.length > 0) {
            // Replace the raw links with properly formatted markdown links
            // First, remove the existing issue and PR reference
            formattedDescription = description.replace(
              /(Issue\s+(?:https:\/\/[^\s:)]+|(?:\[#\d+\]\([^)]+\)))(?:\s*:\s*PR\s*(?:#\d+)(?:,\s*#\d+)*)?)/i,
              ''
            ).trim();
            
            // Extract PR numbers from links
            const prNumbers = prLinks.map(link => {
              const prNumberMatch = link.match(/\/pull\/(\d+)/);
              return prNumberMatch ? prNumberMatch[1] : null;
            }).filter(Boolean);
            
            // Add the formatted links at the end
            formattedDescription += ` (Issue [#${issueNumber}](${issueLink}) : PR ${
              prNumbers.map(num => `#${num}`).join(', ')
            })`;
          }
          
          // Remove any empty parentheses that might be in the description
          formattedDescription = formattedDescription.replace(/\(\s*\)/g, '').trim();
          
          contentParts.push(`      - ${category} : ${formattedDescription}\n`);
        });
      });
    });
    
    contentParts.push('\n');
  });

  contentParts.push('---');
  return contentParts.join('');
}; 