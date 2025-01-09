import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import './annotationHandlers.css';

export const saveAnnotation = async (userId, urlId, annotation) => {
  try {
    const annotationsRef = collection(db, `users/${userId}/links/${urlId}/annotations`);
    
    // Check if annotation already exists for this text
    const existingQuery = query(
      annotationsRef, 
      where('startOffset', '==', annotation.startOffset),
      where('endOffset', '==', annotation.endOffset)
    );
    
    const existingDocs = await getDocs(existingQuery);
    
    if (!existingDocs.empty) {
      // Update existing annotation with new color
      const existingDoc = existingDocs.docs[0];
      await updateDoc(existingDoc.ref, {
        ...annotation,
        updatedAt: new Date()
      });
      return existingDoc.id;
    } else {
      // Create new annotation
      const docRef = await addDoc(annotationsRef, {
        ...annotation,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving annotation:', error);
    throw error;
  }
};

export const getAnnotations = async (usersId, linksId) => {
  try {
    const annotationsRef = collection(db, `users/${usersId}/links/${linksId}/annotations`);
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

// Helper function to calculate text offsets
export const getTextOffsets = (element, selection) => {
  const range = selection.getRangeAt(0);
  const preSelectionRange = range.cloneRange();
  preSelectionRange.selectNodeContents(element);
  preSelectionRange.setEnd(range.startContainer, range.startOffset);
  const start = preSelectionRange.toString().length;

  return {
    start,
    end: start + selection.toString().length
  };
};

// Helper function to apply annotations to content
export const applyAnnotationsToContent = (content, annotations) => {
  const sortedAnnotations = [...annotations].sort((a, b) => b.startOffset - a.startOffset);

  let annotatedContent = content;
  sortedAnnotations.forEach((annotation) => {
    const before = annotatedContent.slice(0, annotation.startOffset);
    const highlighted = annotatedContent.slice(annotation.startOffset, annotation.endOffset);
    const after = annotatedContent.slice(annotation.endOffset);

    const highlightSpan = `<span 
      class="highlighted" 
      style="background-color: ${annotation.color}" 
      data-annotation-id="${annotation.id}" 
      data-text="${highlighted}" 
    >${highlighted}</span>`;

    annotatedContent = before + highlightSpan + after;
  });

  return annotatedContent;
};