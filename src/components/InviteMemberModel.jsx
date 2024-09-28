import React, { useState, useEffect } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { collection, query, where, getDocs, getDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebaseConfig"; // Adjust the import path according to your structure

const InviteMemberModal = ({ show, handleClose, groupId, groupName, inviterId }) => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inviterUsername, setInviterUsername] = useState(""); // Store the inviter's username

  // Fetch the inviter's username from Firestore or auth.currentUser
  useEffect(() => {
    const fetchInviterUsername = async () => {
      if (auth.currentUser) {
        try {
          const userRef = doc(db, "users", auth.currentUser.uid);
          const userSnapshot = await getDoc(userRef);
          if (userSnapshot.exists()) {
            setInviterUsername(userSnapshot.data().username || "Unknown");
          }
        } catch (error) {
          console.error("Error fetching inviter username:", error);
          setInviterUsername("Unknown");
        }
      }
    };

    fetchInviterUsername();
  }, []);

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
      const groupSnapshot = await getDoc(groupRef); // Get the document snapshot

      if (groupSnapshot.exists()) {
        const groupData = groupSnapshot.data(); // Get the document data
        const membersArray = groupData.members || [];

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

      // Create the invitation document in the user's `pendingInvitations` subcollection
      const userInvitationRef = doc(collection(db, "users", inviteeId, "pendingInvitations")); // Generate a new ID for the document

      await setDoc(userInvitationRef, {
        groupId,
        groupName,
        status: "pending",
        timestamp: serverTimestamp(),
        invitedBy: inviterUsername, // Add inviter's username
      });

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
