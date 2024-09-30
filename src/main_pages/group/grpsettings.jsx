import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { ListGroup, Button, Spinner, Modal } from "react-bootstrap"; // Import Modal from react-bootstrap
import starIcon from "../../assets/star.svg"; // Import the star SVG for admin
import { onAuthStateChanged } from "firebase/auth";
import MainNavbar from "../main_navbar";

const GroupSettings = () => {
  const { groupId } = useParams();
  const [groupData, setGroupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usernames, setUsernames] = useState({});
  const [currentUserId, setCurrentUserId] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  // Modal state variables
  const [showKickModal, setShowKickModal] = useState(false); // State to show/hide modal
  const [selectedMember, setSelectedMember] = useState({ id: "", username: "" }); // Track the member being removed

  // Function to fetch the current user's UID
  const fetchCurrentUserUid = () => {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUserId(user.uid);
          setIsUserLoaded(true);
          resolve(user.uid);
        } else {
          setIsUserLoaded(true);
          reject("No user logged in");
        }
      });
    });
  };

  // Function to fetch group details and members
  const fetchGroupDetails = async () => {
    setLoading(true);
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupSnapshot = await getDoc(groupRef);

      if (groupSnapshot.exists()) {
        const groupData = groupSnapshot.data();
        setGroupData(groupData);

        // Set the admin's user ID
        setCreatedBy(groupData.createdBy);

        // Fetch usernames for all group members
        const usernamesMap = await fetchUsernames(groupData.members);
        setUsernames(usernamesMap);
      } else {
        setError("Group not found!");
      }
    } catch (error) {
      console.error("Error fetching group details:", error);
      setError("Failed to fetch group details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch usernames for all members
  const fetchUsernames = async (memberIds) => {
    const usernamesMap = {};
    try {
      for (const memberId of memberIds) {
        const userRef = doc(db, "users", memberId);
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
          usernamesMap[memberId] = userSnapshot.data().username;
        } else {
          usernamesMap[memberId] = "Unknown User";
        }
      }
    } catch (error) {
      console.error("Error fetching usernames:", error);
      setError("Failed to fetch usernames.");
    }
    return usernamesMap;
  };

  // Function to remove a member from the group
  const handleRemoveMember = async () => {
    const { id: memberId } = selectedMember;
    try {
      if (!groupData || !groupData.members.includes(memberId)) return;

      setLoading(true);

      // Reference to the group document
      const groupRef = doc(db, "groups", groupId);
      const userRef = doc(db, "users", memberId);

      // Remove the member ID from the members array in the group document
      await updateDoc(groupRef, {
        members: arrayRemove(memberId),
      });

      // Remove the groupId from the groups array in the user's document
      await updateDoc(userRef, {
        groups: arrayRemove(groupId),
      });

      // Update the local state to reflect the change
      setGroupData((prevData) => ({
        ...prevData,
        members: prevData.members.filter((id) => id !== memberId),
      }));

      setUsernames((prevUsernames) => {
        const newUsernames = { ...prevUsernames };
        delete newUsernames[memberId];
        return newUsernames;
      });

      // Close the modal after successful removal
      setShowKickModal(false);
    } catch (error) {
      console.error("Error removing member:", error);
      setError("Failed to remove member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to open the kick confirmation modal
  const confirmKickMember = (memberId) => {
    setSelectedMember({ id: memberId, username: usernames[memberId] || "Unknown" });
    setShowKickModal(true); // Show the modal
  };

  // UseEffect to fetch current user's UID on component mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        await fetchCurrentUserUid();
      } catch (error) {
        console.error("Failed to fetch current user UID:", error);
      }
    };
    initializeUser();
  }, []);

  // UseEffect to fetch group details only after the current user is loaded
  useEffect(() => {
    if (isUserLoaded && currentUserId) {
      fetchGroupDetails();
    }
  }, [isUserLoaded, currentUserId]);

  // Check if the current user is admin whenever `currentUserId` or `createdBy` changes
  useEffect(() => {
    if (currentUserId && createdBy) {
      setIsAdmin(currentUserId === createdBy);
    }
  }, [currentUserId, createdBy]);

  return (
    <>
      <MainNavbar />
      <div className="container mt-5" style={{ paddingTop: "60px", paddingBottom: "60px" }}>
        <h2>Group Settings</h2>
        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <>
            {/* Display group name */}
            <h4>Group Name: {groupData?.groupName || "Unknown"}</h4>

            {/* Display group members */}
            <h5 className="mt-4">Members</h5>
            <ListGroup>
              {groupData && groupData.members.length > 0 ? (
                groupData.members.map((memberId) => (
                  <ListGroup.Item key={memberId} className="d-flex justify-content-between align-items-center">
                    {/* Display username instead of member ID */}
                    <div>
                      {usernames[memberId] || "Loading..."}
                      {memberId === createdBy && (
                        <img src={starIcon} alt="Admin" style={{ width: "15px", marginLeft: "2px", paddingBottom: "5px" }} />
                      )}
                    </div>
                    {/* Only show the "Remove" button if the current user is the admin */}
                    {isAdmin && (
                      <Button variant="danger" size="sm" onClick={() => confirmKickMember(memberId)} disabled={loading}>
                        KICK
                      </Button>
                    )}
                  </ListGroup.Item>
                ))
              ) : (
                <p>No members found in this group.</p>
              )}
            </ListGroup>
          </>
        )}
      </div>

      {/* Kick Confirmation Modal */}
      <Modal show={showKickModal} onHide={() => setShowKickModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Removal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to remove <strong>{selectedMember.username}</strong> from the group?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowKickModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRemoveMember}>
            Remove
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default GroupSettings;
