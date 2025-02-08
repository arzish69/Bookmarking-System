import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { ListGroup, Button, Spinner, Modal } from "react-bootstrap";
import starIcon from "../../assets/star.svg";
import { onAuthStateChanged } from "firebase/auth";
import MainNavbar from "../../components/navbar";

const GroupSettings = () => {
  const { groupId } = useParams();
  const [groupData, setGroupData] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usernames, setUsernames] = useState({});
  const [currentUserId, setCurrentUserId] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  const [showKickModal, setShowKickModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState({ id: "", username: "" });

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

  const fetchGroupDetails = async () => {
    setLoading(true);
    try {
      const groupRef = doc(db, "groups", groupId);
      const groupSnapshot = await getDoc(groupRef);
  
      if (groupSnapshot.exists()) {
        const groupData = groupSnapshot.data();
        setGroupData(groupData);
        setCreatedBy(groupData.createdBy);
  
        // Get the createdAt timestamp and format it
        const createdAt = groupData.createdAt?.toDate ? groupData.createdAt.toDate() : new Date();
        setCreatedAt(createdAt);
  
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

  const handleRemoveMember = async () => {
    const { id: memberId } = selectedMember;
    try {
      if (!groupData || !groupData.members.includes(memberId)) return;

      setLoading(true);
      const groupRef = doc(db, "groups", groupId);
      const userRef = doc(db, "users", memberId);

      // Remove member from group
      await updateDoc(groupRef, {
        members: arrayRemove(memberId),
      });

      // Remove group from user document
      await updateDoc(userRef, {
        groups: arrayRemove(groupId),
      });

      // Update state after removal
      setGroupData((prevData) => ({
        ...prevData,
        members: prevData.members.filter((id) => id !== memberId),
      }));

      setUsernames((prevUsernames) => {
        const newUsernames = { ...prevUsernames };
        delete newUsernames[memberId];
        return newUsernames;
      });

      setShowKickModal(false);
    } catch (error) {
      console.error("Error removing member:", error);
      setError("Failed to remove member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmKickMember = (memberId) => {
    setSelectedMember({ id: memberId, username: usernames[memberId] || "Unknown" });
    setShowKickModal(true);
  };

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

  useEffect(() => {
    if (isUserLoaded && currentUserId) {
      fetchGroupDetails();
    }
  }, [isUserLoaded, currentUserId]);

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
            <h4>Group Name: {groupData?.groupName || "Unknown"}</h4>
            {createdAt && (
              <p style={{ fontSize: "18px", color: "#6c757d" }}>
                Created on: {createdAt.toLocaleDateString()} {createdAt.toLocaleTimeString()}
              </p>
            )}

            <h5 className="mt-4">Members</h5>
            <ListGroup>
            {groupData && groupData.members.length > 0 ? (
              groupData.members.map((memberId) => (
                <ListGroup.Item key={memberId} className="d-flex justify-content-between align-items-center">
                  <div>
                    <Link to={`/user/${memberId}`} style={{ textDecoration: "none", color: "inherit" }}>
                      {usernames[memberId] || "Loading..."}
                    </Link>
                    {memberId === createdBy && (
                      <img src={starIcon} alt="Admin" style={{ width: "15px", marginLeft: "2px", paddingBottom: "5px" }} />
                    )}
                  </div>
                  {isAdmin && memberId !== createdBy && (
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
          <p>Are you sure you want to remove <strong>{selectedMember.username}</strong> from this group?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowKickModal(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRemoveMember} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "Remove"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default GroupSettings;
