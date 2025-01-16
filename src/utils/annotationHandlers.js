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

const colorMap = {
  'rgba(255, 255, 0, 0.3)': 'yellow',
  'rgba(0, 255, 0, 0.3)': 'green',
  'rgba(255, 192, 203, 0.3)': 'pink',
  'rgba(0, 0, 255, 0.3)': 'blue',
  'rgba(255, 165, 0, 0.3)': 'orange'
};

const createApplierWithId = (className, id) => {
  return rangy.createClassApplier(className, {
    tagNames: ['span'],
    attributes: {'data-annotation-id': id},
    normalize: true
  });
};

const safeDeserializeRange = (serializedRange) => {
  try {
    const rangeInfo = JSON.parse(serializedRange);
    // Try to deserialize the exact range first
    return rangy.deserializeRange(rangeInfo.rangy, document.body);
  } catch (e) {
    console.log('Range deserialization failed:', e);
    return null;
  }
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

    // Get the exact range that was selected
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    
    // Check if the selected range overlaps with any existing highlights
    const highlightedElements = document.querySelectorAll('.highlighted');
    let hasOverlap = false;
    
    highlightedElements.forEach(element => {
      const elementRange = document.createRange();
      elementRange.selectNode(element);
      if (range.compareBoundaryPoints(Range.END_TO_START, elementRange) < 0 &&
          range.compareBoundaryPoints(Range.START_TO_END, elementRange) > 0) {
        hasOverlap = true;
      }
    });

    if (hasOverlap) {
      console.log('Selection overlaps with existing highlight');
      return null;
    }

    const highlightId = crypto.randomUUID();
    const applier = createApplierWithId(`highlight-${colorName}`, highlightId);

    // Store the exact range information
    const serializedRange = JSON.stringify({
      rangy: rangy.serializeRange(range, true, document.body),
      // Store additional context for debugging
      context: {
        text: selectedText,
        startContainer: range.startContainer.textContent,
        startOffset: range.startOffset,
        endContainer: range.endContainer.textContent,
        endOffset: range.endOffset
      }
    });

    // Apply the highlight to the current selection
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
    // Attempt to restore the exact range
    const range = safeDeserializeRange(annotation.serializedRange);
    
    if (range) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const applier = createApplierWithId(`highlight-${annotation.color}`, annotation.id);
      applier.applyToSelection();
      selection.removeAllRanges();
    } else {
      console.warn('Failed to restore highlight:', annotation.id);
    }
  } catch (error) {
    console.error('Error restoring highlight:', error);
  }
};

// The rest of your code (findTextNodeContaining, applyAnnotationsToContent, etc.) remains the same

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

  // Process each annotation
  annotations.forEach(annotation => {
    try {
      // Parse the serialized range info
      const rangeInfo = JSON.parse(annotation.serializedRange);
      const context = rangeInfo.context;
      
      if (!context) {
        console.warn('No context information for annotation:', annotation.id);
        return;
      }

      // Find the specific text node that matches the stored context
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            // Check if this node's content matches our stored context
            if (node.textContent === context.startContainer) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      let found = false;
      let textNode;
      while ((textNode = walker.nextNode()) && !found) {
        // Verify this is the correct node by checking surrounding content
        if (textNode.textContent === context.startContainer) {
          const nodeContent = textNode.textContent;
          const highlightedText = context.text;
          const startOffset = context.startOffset;
          
          // Verify the position matches our stored offsets
          if (nodeContent.substr(startOffset, highlightedText.length) === highlightedText) {
            // Create three parts:
            // 1. Text before the highlight
            const beforeText = nodeContent.substring(0, startOffset);
            
            // 2. The highlighted text
            const highlightedContent = nodeContent.substring(
              startOffset,
              startOffset + highlightedText.length
            );
            
            // 3. Text after the highlight
            const afterText = nodeContent.substring(startOffset + highlightedText.length);

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
            highlightSpan.setAttribute('data-text', highlightedText);
            highlightSpan.textContent = highlightedContent;

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
            found = true;
          }
        }
      }

      if (!found) {
        console.warn('Could not find exact location for annotation:', annotation.id);
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