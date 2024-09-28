import React, { useState } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { collection, query, where, getDocs, getDoc, addDoc, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Adjust the import path according to your structure

const InviteMemberModal = ({ show, handleClose, groupId, groupName, inviterId }) => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Function to handle the invite process
  const handleInvite = async () => {
    console.log("Initiating invite process...");
    console.log(`Username entered: ${username}`);
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!username.trim()) {
        setError("Please enter a username.");
        setLoading(false);
        return;
      }

      // Query the users collection to find the invitee by username
      console.log(`Querying users collection to find username: ${username.trim()}`);
      const q = query(collection(db, "users"), where("username", "==", username.trim()));
      console.log("Attempting to get user data...");
      const userSnapshot = await getDocs(q);
      console.log("User query successful, checking snapshot...");
      console.log("User snapshot result:", userSnapshot);

      if (userSnapshot.empty) {
        console.error(`User with username "${username}" not found.`);
        setError(`User with username "${username}" not found.`);
        setLoading(false);
        return;
      }

      // Get the invitee's document ID (user ID)
      const inviteeDoc = userSnapshot.docs[0];
      const inviteeId = inviteeDoc.id;
      console.log(`Found user with ID: ${inviteeId}`);

      // Check if the invitee is already in the group
      console.log(`Checking if user ${inviteeId} is already a member of group ${groupId}`);
      const groupRef = doc(db, "groups", groupId); // Reference to the group document
      console.log(`that ran`);
      const groupSnapshot = await getDoc(groupRef); // Get the document snapshot
      console.log(`nice`);

      if (groupSnapshot.exists()) {
        const groupData = groupSnapshot.data(); // Get the document data
        console.log("Group data:", groupData);

        // Access the members array
        const membersArray = groupData.members || [];
        console.log("Members array:", membersArray);

        // Check if the invitee is already a member of the group
        const isMember = membersArray.includes(inviteeId);
        if (isMember) {
          setError(`User "${username}" is already a member of the group.`);
          setLoading(false);
          return;
        }
      } else {
        console.error("Group document does not exist!");
        setError("Group document does not exist!");
        setLoading(false);
        return;
      }
      console.log(`is u working ?`);

      // Batch write: create invitation in both 'sentInvitations' and 'pendingInvitations'
      const batch = writeBatch(db);

      // Reference to the group's sentInvitations subcollection
      const groupInvitationRef = doc(collection(db, "groups", groupId, "sentInvitations"));
      console.log(`Creating document in sentInvitations subcollection with ID: ${groupInvitationRef.id}`);
      batch.set(groupInvitationRef, {
        inviteeId,
        inviteeUsername: username,
        inviterId,
        status: "pending",
        timestamp: serverTimestamp(),
      });

      // Reference to the user's pendingInvitations subcollection
      const userInvitationRef = doc(collection(db, "users", inviteeId, "pendingInvitations"), groupInvitationRef.id); // Use the same ID
      console.log(`Creating document in pendingInvitations subcollection for user ${inviteeId} with ID: ${groupInvitationRef.id}`);
      batch.set(userInvitationRef, {
        groupId,
        groupName,
        status: "pending",
        timestamp: serverTimestamp(),
      });

      // Commit the batch write
      console.log("Committing batch write...");
      await batch.commit();

      console.log(`Invitation sent to "${username}" successfully!`);
      setSuccess(`Invitation sent to "${username}" successfully!`);
      setUsername("");
    } catch (err) {
      console.error("Error sending invitation:", err);
      setError(`Failed to send invitation. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Invite a Member</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="form-group">
          <label htmlFor="username">Enter Username</label>
          <input
            type="text"
            className="form-control"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter the username of the person to invite"
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Close
        </Button>
        <Button variant="primary" onClick={handleInvite} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : "Send Invite"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InviteMemberModal;
