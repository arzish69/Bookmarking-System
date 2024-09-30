import React, { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc, query, where, deleteDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ListGroup, Button, Spinner } from "react-bootstrap";

const Notify = ({ setHasPendingInvitations }) => {
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch pending invitations for the current user
  const fetchPendingInvitations = async (userId) => {
    setLoading(true);
    try {
      const invitationsRef = collection(db, "users", userId, "pendingInvitations");
      const pendingQuery = query(invitationsRef, where("status", "==", "pending"));
      const querySnapshot = await getDocs(pendingQuery);

      const invitations = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPendingInvitations(invitations);
      
      // Notify the parent component if there are any pending invitations
      setHasPendingInvitations(invitations.length > 0);
      
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitation) => {
    try {
      setLoading(true);
      const invitationRef = doc(db, "users", currentUser.uid, "pendingInvitations", invitation.id);
      const groupRef = doc(db, "groups", invitation.groupId);

      await updateDoc(groupRef, {
        members: arrayUnion(currentUser.uid),
      });

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        groups: arrayUnion(invitation.groupId),
      });

      await deleteDoc(invitationRef);

      setPendingInvitations((prevInvitations) => {
        const updatedInvitations = prevInvitations.filter((inv) => inv.id !== invitation.id);
        
        // Immediately update the parent component's state if no invitations are left
        setHasPendingInvitations(updatedInvitations.length > 0);

        return updatedInvitations;
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (invitation) => {
    try {
      setLoading(true);
      const invitationRef = doc(db, "users", currentUser.uid, "pendingInvitations", invitation.id);
      await deleteDoc(invitationRef);
      setPendingInvitations((prevInvitations) => {
        const updatedInvitations = prevInvitations.filter((inv) => inv.id !== invitation.id);
        
        // Immediately update the parent component's state if no invitations are left
        setHasPendingInvitations(updatedInvitations.length > 0);

        return updatedInvitations;
      });
    } catch (error) {
      console.error("Error declining invitation:", error);
    } finally {
      setLoading(false);
    }
  };

  // Track authentication state and fetch invitations on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchPendingInvitations(user.uid); // Fetch invitations when user is authenticated immediately on mount
      } else {
        setCurrentUser(null);
        setPendingInvitations([]);
        setHasPendingInvitations(false); // No pending invitations when no user is logged in
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <h4 style={{ paddingBottom: "10px", fontWeight: "bold", color: "#343a40" }}>Notifications</h4>
      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "200px" }}>
          <Spinner animation="border" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <ListGroup>
          {pendingInvitations.length === 0 ? (
            <ListGroup.Item className="text-center" style={{ fontStyle: "italic" }}>
              No pending invitations.
            </ListGroup.Item>
          ) : (
            pendingInvitations.map((invitation) => (
              <ListGroup.Item key={invitation.id} className="d-flex justify-content-between align-items-center p-3 mb-2" style={{ backgroundColor: "#ffffff", border: "1px solid #dee2e6", borderRadius: "5px" }}>
                <div>
                  <h6 style={{ fontWeight: "bold", color: "#495057" }}>
                    You're invited to join the group "<span style={{ color: "#007bff" }}>{invitation.groupName}</span>" by {invitation.invitedBy}
                  </h6>
                </div>
                <div>
                  <Button
                    variant="success"
                    className="mr-2"
                    onClick={() => handleAccept(invitation)}
                    style={{ fontSize: "0.9rem", paddingBottom: "5px" }}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDecline(invitation)}
                    style={{ fontSize: "0.9rem", paddingTop: "5px" }}
                  >
                    Decline
                  </Button>
                </div>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      )}
    </>
  );
};

export default Notify;
