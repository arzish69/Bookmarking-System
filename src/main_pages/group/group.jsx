import React, { useState, useEffect } from "react";
import MainNavbar from "../main_navbar";
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, serverTimestamp, orderBy, query, updateDoc, arrayRemove } from "firebase/firestore"; // Add updateDoc, arrayRemove for handling leave group
import { db, auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Spinner from "react-bootstrap/Spinner";
import Modal from "react-bootstrap/Modal"; // Import Modal for confirmation
import Button from "react-bootstrap/Button"; // Import Button for modal actions
import dustbinIcon from "../../assets/dustbin.svg";
import gearIcon from "../../assets/gear.svg";
import { useParams, useNavigate } from "react-router-dom"; // Use navigate to redirect
import '../../main_pages/group/group.css';

const Groups = () => {
    const [groupUrls, setGroupUrls] = useState([]);
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [groupMessages, setGroupMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true); // Start with loading as true
    const [processingUrl, setProcessingUrl] = useState(null);
    const [processingMessage, setProcessingMessage] = useState(null); // For processing message deletion
    const [currentUser, setCurrentUser] = useState(null); // Track authenticated user
    const [username, setUsername] = useState("");  // Store username separately
    const { groupId } = useParams();  // Replace with actual groupId
    const [groupName, setGroupName] = useState("");
    const [showOptions, setShowOptions] = useState(false); // To show/hide the buttons
    const [gearSpinning, setGearSpinning] = useState(false); // To control the gear spin
    const [showLeaveModal, setShowLeaveModal] = useState(false); // State for showing the leave confirmation modal
    const [leavingGroup, setLeavingGroup] = useState(false); // State for processing leave group
    const navigate = useNavigate();

    // Fetch group URLs from Firestore
    const fetchGroupUrls = async (user) => {
        setLoading(true);
        try {
            if (!user) {
                console.error("No user is logged in.");
                return;
            }

            const q = query(
                collection(db, "groups", groupId, "sharedUrls"), 
                orderBy("timestamp", "desc")
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log("No URLs found for this group.");
                setGroupUrls([]);  // Clear state if no URLs
            } else {
                const urls = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                console.log("Fetched URLs: ", urls);  // Debugging log
                setGroupUrls(urls);  // Set URLs in state
            }
        } catch (error) {
            console.error("Error fetching group URLs:", error);
        } finally {
            setLoading(false);  // Hide loading spinner
        }
    };

    // Fetch group chat messages
    const fetchGroupMessages = async (user) => {
        try {
            const q = query(collection(db, "groups", groupId, "messages"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const messages = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setGroupMessages(messages);
        } catch (error) {
            console.error("Error fetching group messages:", error);
        }
    };

    const fetchGroupName = async () => {
        setLoading(true);
        try {
            const groupRef = doc(db, "groups", groupId);
            const groupDoc = await getDoc(groupRef);

            if (groupDoc.exists()) {
                setGroupName(groupDoc.data().groupName);
            } else {
                console.error("Group not found");
            }
        } catch (error) {
            console.error("Error fetching group name:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (user) => {
        if (user) {
            try {
                const userDocRef = doc(db, "users", user.uid); // Reference to the user's document
                const userDoc = await getDoc(userDocRef); // Fetch the document

                if (userDoc.exists()) {
                    setUsername(userDoc.data().username);  // Set the username from Firestore
                } else {
                    console.error("No such document for the user in Firestore!");
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
            }
        }
    };

    // Set up onAuthStateChanged listener to detect when user logs in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);  // Set the logged-in user
                fetchGroupUrls(user);  // Fetch URLs after authentication
                fetchUserDetails(user);
                fetchGroupMessages(user); // Fetch messages after authentication
                fetchGroupName();
            } else {
                setCurrentUser(null);  // User is not logged in
                console.log("No user is logged in.");
            }
            setLoading(false); // End the loading state after checking auth
        });

        return () => unsubscribe();  // Cleanup listener on unmount
    }, [groupId]);

    // Handle gear click to toggle options
    const handleGearClick = () => {
        setGearSpinning(true); // Start spinning the gear
        setTimeout(() => {
            setGearSpinning(false); // Stop spinning after animation
            setShowOptions((prev) => !prev); // Toggle button visibility
        }, 500); // Spin duration (in ms)
    };

    // Share URL with group
    const handleShareUrl = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!currentUser) return;

            await addDoc(collection(db, "groups", groupId, "sharedUrls"), {
                url,
                title,
                sharedBy: username,
                timestamp: serverTimestamp(),
            });
            setMessage("URL shared with group.");
            await fetchGroupUrls(currentUser); // Refresh the group URLs after successful share
        } catch (error) {
            console.error("Error sharing URL:", error);
        } finally {
            setLoading(false);
            setUrl("");
            setTitle("");
        }
    };

    // Delete shared URL
    const handleDeleteUrl = async (urlId) => {
        setProcessingUrl(urlId); // Set the URL currently being processed for deletion
        try {
            await deleteDoc(doc(db, "groups", groupId, "sharedUrls", urlId));
            await fetchGroupUrls(currentUser); // Refresh the URLs after deletion
            setProcessingUrl(null); // Clear the processing state after deletion
        } catch (error) {
            console.error("Error deleting URL:", error);
            setProcessingUrl(null); // Clear the processing state even if there's an error
        }
    };

    // Send a chat message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            if (!currentUser) return;

            await addDoc(collection(db, "groups", groupId, "messages"), {
                message: newMessage,
                sentBy: username,
                timestamp: serverTimestamp(),
            });
            setNewMessage("");
            await fetchGroupMessages(currentUser); // Refresh the chat messages after successful send
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // Delete chat message
    const handleDeleteMessage = async (messageId) => {
        setProcessingMessage(messageId); // Set the message currently being processed for deletion
        try {
            await deleteDoc(doc(db, "groups", groupId, "messages", messageId));
            await fetchGroupMessages(currentUser); // Refresh the messages after deletion
            setProcessingMessage(null); // Clear the processing state after deletion
        } catch (error) {
            console.error("Error deleting message:", error);
            setProcessingMessage(null); // Clear the processing state even if there's an error
        }
    };

    // Handle leave group functionality
    const handleLeaveGroup = async () => {
        setLeavingGroup(true);
        try {
            // Remove the groupId from the user's 'groups' array
            await updateDoc(doc(db, "users", currentUser.uid), {
                groups: arrayRemove(groupId),
            });

            // Remove the user from the group's 'members' array
            await updateDoc(doc(db, "groups", groupId), {
                members: arrayRemove(currentUser.uid),
            });

            // After leaving, navigate back to the main group page
            navigate("/maingroup");
        } catch (error) {
            console.error("Error leaving group:", error);
        } finally {
            setLeavingGroup(false);
            setShowLeaveModal(false); // Close the modal
        }
    };

    return (
        <>
            <MainNavbar />
            <div className="container mt-4" style={{ paddingTop: "60px", paddingBottom: "60px" }}>
            <div className="d-flex align-items-center">
                    <h1>{loading ? "Loading..." : groupName}</h1>
                    <img
                        src={gearIcon}
                        alt="Gear Icon"
                        className={`ml-3 ${gearSpinning ? "spinning" : ""}`} // Add spinning class when gear is clicked
                        style={{ width: "30px", cursor: "pointer", marginLeft: "20px" }} // Add margin to move the gear to the right
                        onClick={handleGearClick}
                    />
                    {/* Options will roll out when the gear is clicked, moved to the right of the gear */}
                    {showOptions && (
                        <div className="d-flex button-container" style={{ marginLeft: "15px" }}>
                            <button className="btn btn-primary mr-2" style={{ marginRight: "10px" }}>Invite a member</button>
                            <button
                                className="btn btn-danger mr-2"
                                style={{ marginRight: "10px" }}
                                onClick={() => setShowLeaveModal(true)} // Open modal when clicked
                            >
                                Leave Group
                            </button>
                            <button className="btn btn-secondary">Group settings</button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <Spinner animation="border" />
                ) : !currentUser ? (
                    <div>No user is logged in.</div>
                ) : (
                    <>
                        <form onSubmit={handleShareUrl} className="mt-3">
                            <div className="form-group">
                                <label htmlFor="title">Title:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter a title for the webpage"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="url">URL:</label>
                                <input
                                    type="url"
                                    className="form-control"
                                    id="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Enter the webpage URL"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary mt-3" disabled={!currentUser}>
                                Share with Group
                            </button>
                        </form>

                        {message && <div className="alert alert-info mt-3">{message}</div>}

                        <h2 className="mt-5">Shared URLs</h2>
                        <ul className="list-group mt-3">
                            {groupUrls.length === 0 ? (
                                <li className="list-group-item">No shared URLs found.</li>
                            ) : (
                                groupUrls.map((sharedUrl) => (
                                    <li key={sharedUrl.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <a href={sharedUrl.url} target="_blank" rel="noopener noreferrer">
                                                {sharedUrl.title || sharedUrl.url}
                                            </a>
                                            <br />
                                            <small>Shared by: {sharedUrl.sharedBy}</small>
                                            <br />
                                            <small>Timestamp: {new Date(sharedUrl.timestamp?.seconds * 1000).toLocaleString()}</small>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            {processingUrl === sharedUrl.id && (
                                                <Spinner animation="border" size="sm" variant="primary" className="ml-2" />
                                            )}
                                            <img
                                                src={dustbinIcon}
                                                alt="Delete"
                                                style={{ width: "20px", cursor: "pointer" }}
                                                onClick={() => handleDeleteUrl(sharedUrl.id)}
                                                disabled={processingUrl === sharedUrl.id}
                                            />
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>

                        {/* Chat section */}
                        <div className="mt-5">
                            <h2>Group Chat</h2>
                            <ul className="list-group mt-3">
                                {groupMessages.map((msg) => (
                                    <li key={msg.id} className="list-group-item d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>{msg.sentBy}:</strong> {msg.message}
                                            <br />
                                            <small>Timestamp: {new Date(msg.timestamp?.seconds * 1000).toLocaleString()}</small>
                                        </div>
                                        <div className="d-flex align-items-center">
                                            {processingMessage === msg.id && (
                                                <Spinner animation="border" size="sm" variant="primary" className="ml-2" />
                                            )}
                                            <img
                                                src={dustbinIcon}
                                                alt="Delete"
                                                style={{ width: "20px", cursor: "pointer" }}
                                                onClick={() => handleDeleteMessage(msg.id)}
                                                disabled={processingMessage === msg.id}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <form onSubmit={handleSendMessage} className="mt-3">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter your message"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-success mt-2" disabled={!currentUser}>
                                    Send
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {/* Leave Group Confirmation Modal */}
            <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)} centered>
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
                    <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleLeaveGroup} disabled={leavingGroup}>
                        {leavingGroup ? <Spinner animation="border" size="sm" /> : "Leave Group"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Groups;
