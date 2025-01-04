import React, { useState, useEffect } from "react";
import { collection, addDoc, getDoc, updateDoc, doc, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal"; // Import Modal
import Button from "react-bootstrap/Button"; // Import Button
import MainNavbar from "../main_navbar";

const MainGroup = () => {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState(""); // New state for description
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null); // State to track selected group for leaving
  const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false); // State for showing the leave group modal
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false); // State for showing the create group modal
  const navigate = useNavigate();

  // Fetch the groups the user is part of
  const fetchUserGroups = async (userId) => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userGroups = userDoc.data().groups || [];
        const groupList = [];

        for (const groupId of userGroups) {
          const groupDoc = await getDoc(doc(db, "groups", groupId));
          if (groupDoc.exists()) {
            groupList.push({ id: groupDoc.id, ...groupDoc.data() });
          }
        }

        setGroups(groupList);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !newGroupDescription.trim()) return;

    setLoading(true);
    try {
      const newGroup = await addDoc(collection(db, "groups"), {
        groupName: newGroupName,
        description: newGroupDescription,
        members: [currentUser.uid], // Add the creator as a member
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(), // Add server-generated timestamp
      });

      // Update the user's group list
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userGroups = userDoc.data().groups || [];
        await updateDoc(userRef, {
          groups: [...userGroups, newGroup.id],
        });
      }

      // Refresh the group list
      fetchUserGroups(currentUser.uid);
      setNewGroupName("");
      setNewGroupDescription(""); // Clear the description field
      setShowCreateGroupModal(false); // Close the modal after creation
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setLoading(false);
    }
  };

  // Leave a group
  const handleLeaveGroup = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, "users", currentUser.uid);

      // Remove the groupId from the user's 'groups' array
      await updateDoc(userRef, {
        groups: arrayRemove(selectedGroupId),
      });

      // Remove the user's UID from the group's 'members' array
      const groupRef = doc(db, "groups", selectedGroupId);
      await updateDoc(groupRef, {
        members: arrayRemove(currentUser.uid),
      });

      // Refresh the group list
      fetchUserGroups(currentUser.uid);
      setShowLeaveGroupModal(false); // Close the modal
    } catch (error) {
      console.error("Error leaving group:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle navigating to a specific group page
  const handleGroupClick = (groupId) => {
    navigate(`/groups/${groupId}`); // Navigate to the group page with the groupId
  };

  // Handle showing the leave group confirmation modal
  const confirmLeaveGroup = (groupId) => {
    setSelectedGroupId(groupId); // Track which group the user is trying to leave
    setShowLeaveGroupModal(true); // Show the modal
  };

  // Fetch current user and their groups
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserGroups(user.uid);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <MainNavbar />
      <div className="container mt-4" style={{ paddingTop: "60px" }}>
        <h1>My Groups</h1>

        {loading ? (
          <Spinner animation="border" />
        ) : (
          <>
            <h3>Groups you're part of:</h3>
            <ul className="list-group mt-3">
              {groups.length === 0 ? (
                <li className="list-group-item">You are not part of any groups yet.</li>
              ) : (
                groups.map((group) => (
                  <li key={group.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                      <strong onClick={() => handleGroupClick(group.id)} style={{ cursor: "pointer" }}>
                        {group.groupName}
                      </strong>
                      <br />
                      <small>{group.description}</small>
                    </div>
                    <button
                      className="btn btn-danger"
                      onClick={() => confirmLeaveGroup(group.id)} // Show modal for confirmation
                      disabled={loading}
                    >
                      Leave Group
                    </button>
                  </li>
                ))
              )}
            </ul>

            {/* Create new group button */}
            <div className="mt-5">
              <button className="btn btn-primary" onClick={() => setShowCreateGroupModal(true)} disabled={loading}>
                Create Group
              </button>
            </div>
          </>
        )}
      </div>

      {/* Leave Group Confirmation Modal */}
      <Modal show={showLeaveGroupModal} onHide={() => setShowLeaveGroupModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Leaving Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to leave this group?</p>
          <p>
            <strong>Warning:</strong> All chat messages, URLs, and other group content will be lost and cannot be recovered.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLeaveGroupModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleLeaveGroup}>
            Leave Group
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Group Modal */}
      <Modal show={showCreateGroupModal} onHide={() => setShowCreateGroupModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Group Description</label>
            <textarea
              className="form-control"
              placeholder="Enter group description"
              rows="3"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateGroupModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateGroup} disabled={!newGroupName.trim() || !newGroupDescription.trim()}>
            Create Group
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MainGroup;
