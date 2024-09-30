import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // To get groupId from the URL params
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore"; // Firestore imports
import { db, auth } from "../../firebaseConfig"; // Import your Firestore configuration and auth
import { ListGroup, Button, Spinner } from "react-bootstrap";
import starIcon from "../../assets/star.svg"; // Import the star SVG for admin
import { onAuthStateChanged } from "firebase/auth"; // Use onAuthStateChanged to ensure user is loaded
import MainNavbar from "../main_navbar";

const GroupSettings = () => {
  const { groupId } = useParams(); // Extract groupId from the URL params
  const [groupData, setGroupData] = useState(null); // State to store group information
  const [loading, setLoading] = useState(true); // State to manage loading
  const [error, setError] = useState(""); // State to manage error messages
  const [usernames, setUsernames] = useState({}); // State to store usernames mapped by member IDs
  const [currentUserId, setCurrentUserId] = useState(""); // State to store the currently logged-in user's UID
  const [createdBy, setCreatedBy] = useState(""); // State to store the group's admin user ID
  const [isAdmin, setIsAdmin] = useState(false); // State to track if the current user is the admin
  const [isUserLoaded, setIsUserLoaded] = useState(false); // State to ensure user is fully loaded

  // Function to fetch the current user's UID
  const fetchCurrentUserUid = () => {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUserId(user.uid); // Store the UID in state
          setIsUserLoaded(true); // Set user loaded to true
          resolve(user.uid);
        } else {
          setIsUserLoaded(true); // Even if no user is logged in, mark user loaded as true
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
  const handleRemoveMember = async (memberId) => {
    try {
      if (!groupData || !groupData.members.includes(memberId)) return;

      setLoading(true);

      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        members: arrayRemove(memberId),
      });

      setGroupData((prevData) => ({
        ...prevData,
        members: prevData.members.filter((id) => id !== memberId),
      }));

      setUsernames((prevUsernames) => {
        const newUsernames = { ...prevUsernames };
        delete newUsernames[memberId];
        return newUsernames;
      });

      console.log(`Member ${memberId} removed successfully from the group.`);
    } catch (error) {
      console.error("Error removing member:", error);
      setError("Failed to remove member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // UseEffect to fetch current user's UID on component mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        await fetchCurrentUserUid(); // Fetch current user's UID and set state
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

  // Return loading spinner if user or group data is not yet loaded
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
                    <Button variant="danger" size="sm" onClick={() => handleRemoveMember(memberId)} disabled={loading}>
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
    </>
  );
};

export default GroupSettings;
