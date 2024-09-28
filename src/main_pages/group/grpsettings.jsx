import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // To get groupId from the URL params
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore"; // Firestore imports
import { db } from "../../firebaseConfig"; // Import your Firestore configuration
import { ListGroup, Button, Spinner } from "react-bootstrap"; // Use Bootstrap for UI components

const GroupSettings = () => {
  const { groupId } = useParams(); // Extract groupId from the URL params
  const [groupData, setGroupData] = useState(null); // State to store group information
  const [loading, setLoading] = useState(true); // State to manage loading
  const [error, setError] = useState(""); // State to manage error messages

  // Function to fetch group details and members
  const fetchGroupDetails = async () => {
    setLoading(true);
    try {
      // Reference to the group document in Firestore
      const groupRef = doc(db, "groups", groupId);
      const groupSnapshot = await getDoc(groupRef);

      if (groupSnapshot.exists()) {
        setGroupData(groupSnapshot.data()); // Store the group data
      } else {
        setError("Group not found!");
      }
    } catch (error) {
      console.error("Error fetching group details:", error);
      setError("Failed to fetch group details. Please try again later.");
    } finally {
      setLoading(false); // Set loading to false after data is fetched
    }
  };

  // Function to remove a member from the group
  const handleRemoveMember = async (memberId) => {
    try {
      if (!groupData || !groupData.members.includes(memberId)) return;

      setLoading(true);

      // Reference to the group document
      const groupRef = doc(db, "groups", groupId);

      // Remove the member ID from the `members` array in the group document
      await updateDoc(groupRef, {
        members: arrayRemove(memberId),
      });

      // Update the local state to reflect the change
      setGroupData((prevData) => ({
        ...prevData,
        members: prevData.members.filter((id) => id !== memberId),
      }));

      console.log(`Member ${memberId} removed successfully from the group.`);
    } catch (error) {
      console.error("Error removing member:", error);
      setError("Failed to remove member. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // UseEffect to fetch group details on component mount
  useEffect(() => {
    if (groupId) {
      fetchGroupDetails(); // Fetch group details when component mounts
    }
  }, [groupId]);

  return (
    <div className="container mt-5">
      <h2>Group Settings</h2>
      {loading ? (
        <Spinner animation="border" />
      ) : error ? (
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
                <ListGroup.Item
                  key={memberId}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>{memberId}</div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveMember(memberId)}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                </ListGroup.Item>
              ))
            ) : (
              <p>No members found in this group.</p>
            )}
          </ListGroup>

          {/* Add more group settings below as needed */}
        </>
      )}
    </div>
  );
};

export default GroupSettings;
