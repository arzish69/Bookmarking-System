import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import rangy from 'rangy';
import 'rangy/lib/rangy-classapplier';
import 'rangy/lib/rangy-serializer';
import 'rangy/lib/rangy-selectionsaverestore';
import 'rangy/lib/rangy-textrange';
import './annotationHandlers.css';

if (!rangy.initialized) {
  rangy.init();
}

const colorMap = {
  'rgba(255, 255, 0, 0.3)': 'yellow',
  'rgba(0, 255, 0, 0.3)': 'green',
  'rgba(255, 192, 203, 0.3)': 'pink',
  'rgba(0, 0, 255, 0.3)': 'blue',
  'rgba(255, 165, 0, 0.3)': 'orange'
};

const createApplierWithId = (colorName, id) => {
  return rangy.createClassApplier(`highlight-${colorName}`, {
    elementTagName: 'span',
    elementProperties: {
      className: 'highlighted'
    },
    attributes: {
      'data-annotation-id': id
    },
    normalize: true
  });
};

// Enhanced findTextInDocument with scoring
const findTextInDocument = (searchText) => {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        return node.textContent.includes(searchText) ? 
          NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const matches = [];
  let node;
  while (node = walker.nextNode()) {
    const index = node.textContent.indexOf(searchText);
    if (index !== -1) {
      // Calculate surrounding context score
      const contextBefore = node.textContent.substring(Math.max(0, index - 200), index);
      const contextAfter = node.textContent.substring(index + searchText.length, 
        index + searchText.length + 200);
      
      matches.push({
        node,
        index,
        contextBefore,
        contextAfter,
        xpath: getXPath(node)
      });
    }
  }
  return matches;
};

// Helper function to get XPath
const getXPath = (node) => {
  if (!node) return '';
  const parts = [];
  while (node && node.nodeType !== Node.DOCUMENT_NODE) {
    if (node.nodeType === Node.TEXT_NODE) {
      const siblings = Array.from(node.parentNode.childNodes);
      const index = siblings.findIndex(n => n === node);
      parts.unshift(`text()[${index + 1}]`);
    } else {
      const tagName = node.tagName.toLowerCase();
      const siblings = Array.from(node.parentNode.children || []);
      const sameTagSiblings = siblings.filter(n => n.tagName.toLowerCase() === tagName);
      const index = sameTagSiblings.findIndex(n => n === node);
      parts.unshift(`${tagName}[${index + 1}]`);
    }
    node = node.parentNode;
  }
  return '/' + parts.join('/');
};

const createRangeFromText = (node, startIndex, text) => {
  const range = document.createRange();
  range.setStart(node, startIndex);
  range.setEnd(node, startIndex + text.length);
  return range;
};

export const createHighlight = (color, selection) => {
  try {
    const colorName = colorMap[color];
    if (!colorName || !selection || selection.isCollapsed) {
      console.error('Invalid color or selection');
      return null;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    // Check for overlapping highlights
    const highlightedElements = document.querySelectorAll('.highlighted');
    for (const element of highlightedElements) {
      const elementRange = document.createRange();
      elementRange.selectNode(element);
      if (range.compareBoundaryPoints(Range.END_TO_START, elementRange) < 0 &&
          range.compareBoundaryPoints(Range.START_TO_END, elementRange) > 0) {
        console.log('Selection overlaps with existing highlight');
        return null;
      }
    }

    const highlightId = crypto.randomUUID();
    const applier = createApplierWithId(colorName, highlightId);

    // Enhanced range serialization
    const serializedRange = JSON.stringify({
      text: selectedText,
      rangy: rangy.serializeRange(range, true, document.body),
      contextBefore: range.startContainer.textContent?.substring(
        Math.max(0, range.startOffset - 200),
        range.startOffset
      ),
      contextAfter: range.endContainer.textContent?.substring(
        range.endOffset,
        range.endOffset + 200
      ),
      xpath: getXPath(range.startContainer),
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      domHash: hashNode(range.commonAncestorContainer)
    });

    applier.applyToSelection();

    const highlightInfo = {
      id: highlightId,
      text: selectedText,
      color: colorName,
      serializedRange,
      note: ''
    };

    selection.removeAllRanges();
    return highlightInfo;
  } catch (error) {
    console.error('Error in createHighlight:', error);
    return null;
  }
};

// Helper function to create a hash of DOM structure
const hashNode = (node) => {
  const str = node.innerHTML || node.textContent;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString(36);
};

export const restoreHighlight = async (annotation) => {
  try {
    const rangeInfo = JSON.parse(annotation.serializedRange);
    let range = null;
    let restorationMethod = '';

    // Method 1: Try rangy deserialization
    try {
      range = rangy.deserializeRange(rangeInfo.rangy, document.body);
      if (range && range.toString().trim() === rangeInfo.text.trim()) {
        restorationMethod = 'rangy';
      }
    } catch (e) {
      console.log('Rangy deserialization failed, trying xpath method');
    }

    // Method 2: Try XPath-based restoration
    if (!range && rangeInfo.xpath) {
      try {
        const node = document.evaluate(rangeInfo.xpath, document, null,
          XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (node) {
          range = createRangeFromText(node, rangeInfo.startOffset, rangeInfo.text);
          if (range && range.toString().trim() === rangeInfo.text.trim()) {
            restorationMethod = 'xpath';
          }
        }
      } catch (e) {
        console.log('XPath restoration failed, trying context matching');
      }
    }

    // Method 3: Context-based matching
    if (!range) {
      const matches = findTextInDocument(rangeInfo.text);
      if (matches.length > 0) {
        let bestMatch = matches[0];
        let bestScore = -1;

        for (const match of matches) {
          const score = calculateContextScore(
            match.contextBefore, rangeInfo.contextBefore,
            match.contextAfter, rangeInfo.contextAfter
          );
          if (score > bestScore) {
            bestScore = score;
            bestMatch = match;
          }
        }

        if (bestScore > 0.7) { // Threshold for acceptable match
          range = createRangeFromText(bestMatch.node, bestMatch.index, rangeInfo.text);
          restorationMethod = 'context';
        }
      }
    }

    if (range && range.toString().trim() === rangeInfo.text.trim()) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const applier = createApplierWithId(annotation.color, annotation.id);
      applier.applyToSelection();
      selection.removeAllRanges();

      // Log successful restoration
      await saveRestorationLog(annotation.id, true, restorationMethod);
      return true;
    }
    
    throw new Error('Could not restore highlight accurately');
  } catch (error) {
    console.warn('Failed to restore highlight:', annotation.id, error);
    await saveRestorationLog(annotation.id, false, null, error.message);
    return false;
  }
};

const calculateContextScore = (actualBefore, expectedBefore, actualAfter, expectedAfter) => {
  const beforeScore = calculateSimilarity(actualBefore || '', expectedBefore || '');
  const afterScore = calculateSimilarity(actualAfter || '', expectedAfter || '');
  return (beforeScore + afterScore) / 2;
};

const calculateSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  return (longer.length - editDistance(longer, shorter)) / longer.length;
};

const editDistance = (str1, str2) => {
  const matrix = Array(str2.length + 1).fill().map(() => 
    Array(str1.length + 1).fill(0)
  );
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      if (str1[i-1] === str2[j-1]) {
        matrix[j][i] = matrix[j-1][i-1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j-1][i-1] + 1,
          matrix[j][i-1] + 1,
          matrix[j-1][i] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
};

export const applyAnnotationsToContent = (content, annotations) => {
  if (!content || !annotations?.length) return content;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;

  annotations.forEach(annotation => {
    try {
      const rangeInfo = JSON.parse(annotation.serializedRange);
      const textFinder = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            return node.textContent.includes(rangeInfo.text) ? 
              NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        }
      );

      let textNode;
      while ((textNode = textFinder.nextNode())) {
        const nodeText = textNode.textContent;
        const index = nodeText.indexOf(rangeInfo.text);
        
        if (index !== -1) {
          const beforeText = nodeText.substring(0, index);
          const highlightedText = nodeText.substring(index, index + rangeInfo.text.length);
          const afterText = nodeText.substring(index + rangeInfo.text.length);

          const fragment = document.createDocumentFragment();
          
          if (beforeText) {
            fragment.appendChild(document.createTextNode(beforeText));
          }

          const highlightSpan = document.createElement('span');
          highlightSpan.className = `highlighted highlight-${annotation.color}`;
          highlightSpan.setAttribute('data-annotation-id', annotation.id);
          highlightSpan.textContent = highlightedText;

          if (annotation.note) {
            const noteIcon = document.createElement('span');
            noteIcon.className = 'note-icon';
            noteIcon.innerHTML = '📝';
            noteIcon.setAttribute('data-annotation-id', annotation.id);
            noteIcon.setAttribute('data-note', annotation.note);
            highlightSpan.appendChild(noteIcon);
          }

          fragment.appendChild(highlightSpan);
          
          if (afterText) {
            fragment.appendChild(document.createTextNode(afterText));
          }

          textNode.parentNode.replaceChild(fragment, textNode);
          break;
        }
      }
    } catch (error) {
      console.error('Error applying annotation:', error);
    }
  });

  return tempDiv.innerHTML;
};

export const saveAnnotation = async (userId, urlId, annotation) => {
  try {
    const annotationsRef = collection(db, `users/${userId}/links/${urlId}/annotations`);
    const docRef = await addDoc(annotationsRef, {
      ...annotation,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Successfully saved annotation with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving annotation:', error);
    throw error;
  }
};

const saveRestorationLog = async (annotationId, success, method, error = null) => {
  try {
    const logsRef = collection(db, 'annotationRestorationLogs');
    await addDoc(logsRef, {
      annotationId,
      success,
      method,
      error,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Error saving restoration log:', err);
  }
};

export const getAnnotations = async (userId, urlId) => {
  try {
    const annotationsRef = collection(db, `users/${userId}/links/${urlId}/annotations`);
    const annotationsSnap = await getDocs(annotationsRef);
    return annotationsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching annotations:', error);
    throw error;
  }
};

export const deleteAnnotation = async (userId, urlId, annotationId) => {
  try {
    const annotationRef = doc(db, `users/${userId}/links/${urlId}/annotations`, annotationId);
    await deleteDoc(annotationRef);
    console.log('Successfully deleted annotation:', annotationId);
  } catch (error) {
    console.error('Error deleting annotation:', error);
    throw error;
  }
};