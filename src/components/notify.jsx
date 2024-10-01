import React, { useEffect, useState } from "react";
import { doc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ListGroup, Button, Spinner } from "react-bootstrap";

const Notify = ({ currentUser, pendingInvitations, setPendingInvitations, setHasPendingInvitations }) => {
  const [loading, setLoading] = useState(false);

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
