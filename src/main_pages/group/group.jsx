import React, { useState, useEffect } from "react";
import MainNavbar from "../main_navbar";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import Spinner from "react-bootstrap/Spinner";
import dustbinIcon from "../../assets/dustbin.svg";

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
    const groupId = "groupId"; // Replace with actual groupId

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

    // Set up onAuthStateChanged listener to detect when user logs in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);  // Set the logged-in user
                fetchGroupUrls(user);  // Fetch URLs after authentication
                fetchGroupMessages(user); // Fetch messages after authentication
            } else {
                setCurrentUser(null);  // User is not logged in
                console.log("No user is logged in.");
            }
            setLoading(false); // End the loading state after checking auth
        });

        return () => unsubscribe();  // Cleanup listener on unmount
    }, [groupId]);

    // Share URL with group
    const handleShareUrl = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!currentUser) return;

            await addDoc(collection(db, "groups", groupId, "sharedUrls"), {
                url,
                title,
                sharedBy: currentUser.email,
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
                sentBy: currentUser.email,
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

    return (
        <>
            <MainNavbar />
            <div className="container mt-4" style={{ paddingTop: "60px", paddingBottom: "60px" }}>
                <h1>My Group</h1>

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
        </>
    );
};

export default Groups;
