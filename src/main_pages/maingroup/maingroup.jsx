import React, { useState, useEffect } from "react";
import { collection, addDoc, getDoc, getDocs, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Spinner from "react-bootstrap/Spinner";

const MainGroup = () => {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
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
    if (!newGroupName.trim()) return;
  
    setLoading(true);
    try {
      const newGroup = await addDoc(collection(db, "groups"), {
        groupName: newGroupName,
        members: [currentUser.uid], // Add the creator as a member
        description: "This is a new group",
        createdBy: currentUser.uid,
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
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setLoading(false);
    }
  };  

  // Handle navigating to a specific group page
  const handleGroupClick = (groupId) => {
    navigate(`/groups/${groupId}`); // Navigate to the group page with the groupId
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
                <li key={group.id} className="list-group-item" onClick={() => handleGroupClick(group.id)}>
                  <strong>{group.groupName}</strong>
                  <br />
                  <small>{group.description}</small>
                </li>
              ))
            )}
          </ul>

          {/* Create new group */}
          <div className="mt-5">
            <h3>Create a new group</h3>
            <input
              type="text"
              className="form-control"
              placeholder="Enter group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <button className="btn btn-primary mt-3" onClick={handleCreateGroup} disabled={loading}>
              Create Group
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MainGroup;
