import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import rangy from 'rangy';
import 'rangy/lib/rangy-classapplier';
import 'rangy/lib/rangy-serializer';
import 'rangy/lib/rangy-selectionsaverestore';
import 'rangy/lib/rangy-textrange';
import './annotationHandlers.css';

// Initialize rangy
if (!rangy.initialized) {
  rangy.init();
}

// Map color values to color names
const colorMap = {
  'rgba(255, 255, 0, 0.3)': 'yellow',
  'rgba(0, 255, 0, 0.3)': 'green',
  'rgba(255, 192, 203, 0.3)': 'pink',
  'rgba(0, 0, 255, 0.3)': 'blue',
  'rgba(255, 165, 0, 0.3)': 'orange'
};

// Function to create applier with dynamic ID
const createApplierWithId = (className, id) => {
  return rangy.createCssClassApplier(className, {
    tagNames: ['span'],
    attributes: {'data-annotation-id': id},
    normalize: true
  });
};

const safeDeserializeRange = (serializedRange) => {
  try {
    // First try standard deserialization
    const range = rangy.deserializeRange(serializedRange, document.body);
    if (range) return range;
  } catch (e) {
    console.log('Standard deserialization failed, attempting fallback...', e);
  }

  try {
    // Fallback: Parse the serialized range to get text content
    const match = serializedRange.match(/"characterRange":({[^}]+})/);
    if (match) {
      const rangeData = JSON.parse(match[1]);
      if (rangeData.text) {
        // Create a new range based on text content
        return {
          text: rangeData.text,
          start: rangeData.start,
          end: rangeData.end
        };
      }
    }
  } catch (e) {
    console.log('Fallback deserialization failed', e);
  }

  return null;
};

export const createHighlight = (color, selection) => {
  try {
    console.log('Creating highlight with color:', color);
    const colorName = colorMap[color];
    if (!colorName) {
      console.error('Invalid color value:', color);
      return null;
    }

    if (!selection || selection.isCollapsed) {
      console.error('Invalid selection');
      return null;
    }

    const highlightId = crypto.randomUUID();
    const applier = createApplierWithId(`highlight-${colorName}`, highlightId);

    // Store additional information about the selection
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    // Enhanced serialization with text content
    const serializedRange = JSON.stringify({
      rangy: rangy.serializeRange(range, true, document.body),
      characterRange: {
        text: selectedText,
        start: range.startOffset,
        end: range.endOffset
      }
    });

    applier.applyToSelection();

    const highlightInfo = {
      id: highlightId,
      text: selectedText,
      color: colorName,
      serializedRange,
      note: ''
    };

    console.log('Created highlight info:', highlightInfo);
    selection.removeAllRanges();
    return highlightInfo;
  } catch (error) {
    console.error('Error in createHighlight:', error);
    return null;
  }
};

export const restoreHighlight = (annotation) => {
  try {
    // Parse the enhanced serialized range
    const rangeInfo = JSON.parse(annotation.serializedRange);
    const range = safeDeserializeRange(rangeInfo.rangy);

    // If we got a valid Range object
    if (range instanceof Range) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const applier = createApplierWithId(`highlight-${annotation.color}`, annotation.id);
      applier.applyToSelection();
      selection.removeAllRanges();
      return;
    }

    // Fallback: text search method
    const textNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let foundMatch = false;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const index = node.textContent.indexOf(annotation.text);
      if (index !== -1) {
        try {
          const newRange = document.createRange();
          newRange.setStart(node, index);
          newRange.setEnd(node, index + annotation.text.length);
          
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(newRange);

          const applier = createApplierWithId(`highlight-${annotation.color}`, annotation.id);
          applier.applyToSelection();
          selection.removeAllRanges();
          foundMatch = true;
          break;
        } catch (e) {
          console.warn('Failed to create range for node:', e);
          continue;
        }
      }
    }

    if (!foundMatch) {
      console.warn('Could not find matching text for annotation:', annotation.text);
    }
  } catch (error) {
    console.error('Error restoring highlight:', error);
  }
};

export const findTextNodeContaining = (node, searchText) => {
  const walk = document.createTreeWalker(
    node,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        return node.textContent.includes(searchText) ? 
          NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  return walk.nextNode();
};

export const applyAnnotationsToContent = (content, annotations) => {
  if (!content || !annotations || annotations.length === 0) return content;

  // Create a temporary div to hold the content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;

  // Sort annotations by their position in the content
  // This ensures we process them in order from start to end
  annotations.sort((a, b) => {
    const indexA = tempDiv.textContent.indexOf(a.text);
    const indexB = tempDiv.textContent.indexOf(b.text);
    return indexA - indexB;
  });

  // Process each annotation
  annotations.forEach(annotation => {
    try {
      // Find all instances of the text to highlight
      const textToHighlight = annotation.text;
      let currentNode = tempDiv;
      let textNode;

      while ((textNode = findTextNodeContaining(currentNode, textToHighlight))) {
        const nodeContent = textNode.textContent;
        const startIndex = nodeContent.indexOf(textToHighlight);
        
        if (startIndex >= 0) {
          // Create three parts:
          // 1. Text before the highlight
          const beforeText = nodeContent.substring(0, startIndex);
          
          // 2. The highlighted text
          const highlightedText = nodeContent.substring(startIndex, startIndex + textToHighlight.length);
          
          // 3. Text after the highlight
          const afterText = nodeContent.substring(startIndex + textToHighlight.length);

          // Create a document fragment to hold all pieces
          const fragment = document.createDocumentFragment();

          // Add text before highlight if it exists
          if (beforeText) {
            fragment.appendChild(document.createTextNode(beforeText));
          }

          // Create the highlight span
          const highlightSpan = document.createElement('span');
          highlightSpan.className = `highlighted highlight-${annotation.color}`;
          highlightSpan.setAttribute('data-annotation-id', annotation.id);
          highlightSpan.setAttribute('data-text', textToHighlight);
          highlightSpan.textContent = highlightedText;

          // Add note icon if there's a note
          if (annotation.note) {
            const noteIcon = document.createElement('span');
            noteIcon.className = 'note-icon';
            noteIcon.innerHTML = '📝';
            noteIcon.setAttribute('data-annotation-id', annotation.id);
            noteIcon.setAttribute('data-note', annotation.note);
            highlightSpan.appendChild(noteIcon);
          }

          // Add the highlight span to the fragment
          fragment.appendChild(highlightSpan);

          // Add text after highlight if it exists
          if (afterText) {
            fragment.appendChild(document.createTextNode(afterText));
          }

          // Replace the original text node with our fragment
          textNode.parentNode.replaceChild(fragment, textNode);
        }

        // Move to next node
        currentNode = textNode;
      }
    } catch (error) {
      console.error('Error applying annotation:', error, annotation);
    }
  });

  return tempDiv.innerHTML;
};

export const saveAnnotation = async (userId, urlId, annotation) => {
  try {
    const annotationsRef = collection(db, `users/${userId}/links/${urlId}/annotations`);
    
    // Always create a new annotation document
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