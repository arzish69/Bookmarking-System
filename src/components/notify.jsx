import React, { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc, query, where, deleteDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebaseConfig"; // Adjust the import path based on your file structure
import { onAuthStateChanged } from "firebase/auth";
import { ListGroup, Button, Spinner } from "react-bootstrap";

const Notify = () => {
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch pending invitations for the current user
  const fetchPendingInvitations = async (userId) => {
    setLoading(true);
    try {
      // Create a reference to the pendingInvitations subcollection
      const invitationsRef = collection(db, "users", userId, "pendingInvitations");
  
      // Create a query that only fetches invitations where status is "pending"
      const pendingQuery = query(invitationsRef, where("status", "==", "pending"));
  
      // Execute the query and get the documents
      const querySnapshot = await getDocs(pendingQuery);
  
      // Map through the results and create an array of invitation objects
      const invitations = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      console.log("Fetched pending invitations:", invitations);
      setPendingInvitations(invitations); // Update state with pending invitations only
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle accepting an invitation
  const handleAccept = async (invitation) => {
    try {
      setLoading(true);
      console.log("Accepting invitation:", invitation);
  
      // Reference to the invitation document in `pendingInvitations`
      const invitationRef = doc(db, "users", currentUser.uid, "pendingInvitations", invitation.id);
  
      const groupRef = doc(db, "groups", invitation.groupId);

      // Add the user to the group's `members` array field
      await updateDoc(groupRef, {
        members: arrayUnion(currentUser.uid),
      });

      console.log(`User ${currentUser.uid} successfully added to group ${invitation.groupId}`);

      const userRef = doc(db, "users", currentUser.uid);

    // Add the groupId to the user's `groups` array field
    await updateDoc(userRef, {
      groups: arrayUnion(invitation.groupId),
    });
    console.log(`Group ${invitation.groupId} added to user's groups array`);
  
      // Delete the document from `pendingInvitations`
      await deleteDoc(invitationRef);
  
      // Remove the invitation from the state after deletion
      setPendingInvitations((prevInvitations) => prevInvitations.filter((inv) => inv.id !== invitation.id));
      console.log("Invitation accepted and document deleted successfully.");
    } catch (error) {
      console.error("Error accepting invitation:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDecline = async (invitation) => {
    try {
      setLoading(true);
      console.log("Declining invitation:", invitation);
  
      // Reference to the invitation document in `pendingInvitations`
      const invitationRef = doc(db, "users", currentUser.uid, "pendingInvitations", invitation.id);
  
      // Delete the document from `pendingInvitations`
      await deleteDoc(invitationRef);
  
      // Remove the invitation from the state after deletion
      setPendingInvitations((prevInvitations) => prevInvitations.filter((inv) => inv.id !== invitation.id));
      console.log("Invitation declined and document deleted successfully.");
    } catch (error) {
      console.error("Error declining invitation:", error);
    } finally {
      setLoading(false);
    }
  };

  // Track authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        console.log("Authenticated user:", user.uid);
        fetchPendingInvitations(user.uid); // Fetch invitations when user is authenticated
      } else {
        setCurrentUser(null);
        setPendingInvitations([]);
        console.log("No user is authenticated.");
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  return (
    <div className="container mt-5">
      <h2>Notifications</h2>
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <ListGroup>
          {pendingInvitations.length === 0 ? (
            <ListGroup.Item>No pending invitations.</ListGroup.Item>
          ) : (
            pendingInvitations.map((invitation) => (
              <ListGroup.Item key={invitation.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>You're invited in the group "{invitation.groupName}"</h6>
                </div>
                <div>
                  <Button
                    variant="success"
                    className="mr-2"
                    onClick={() => handleAccept(invitation)}
                    disabled={invitation.status !== "pending"}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDecline(invitation)}
                    disabled={invitation.status !== "pending"}
                  >
                    Decline
                  </Button>
                </div>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      )}
    </div>
  );
};

export default Notify;
