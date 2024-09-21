import React, { useState, useEffect } from "react";
import MainNavbar from "../main_navbar";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import Spinner from "react-bootstrap/Spinner";
import dustbinIcon from "../../assets/dustbin.svg"

const Groups = () => {
    const [groupUrls, setGroupUrls] = useState([]);
    const [url, setUrl] = useState("");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [groupMessages, setGroupMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [processingUrl, setProcessingUrl] = useState(null); 
    const groupId = "groupId"; // Set your groupId here

    // Fetch group URLs from Firestore
    const fetchGroupUrls = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) return;

            const q = query(collection(db, "groups", groupId, "sharedUrls"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const urls = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setGroupUrls(urls);
        } catch (error) {
            console.error("Error fetching group URLs:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch group chat messages
    const fetchGroupMessages = async () => {
        try {
            const q = query(collection(db, "groups", groupId, "messages"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const messages = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setGroupMessages(messages);
        } catch (error) {
            console.error("Error fetching group messages:", error);
        }
    };

    // Share URL with group
    const handleShareUrl = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) return;

            await addDoc(collection(db, "groups", groupId, "sharedUrls"), {
                url,
                title,
                sharedBy: user.email,
                timestamp: serverTimestamp(),
            });
            setMessage("URL shared with group.");
            await fetchGroupUrls(); // Refresh the group URLs after successful share
        } catch (error) {
            console.error("Error sharing URL:", error);
        } finally {
            setLoading(false);
            setUrl("");
            setTitle("");
        }
    };

    // Send a chat message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const user = auth.currentUser;
            if (!user) return;

            await addDoc(collection(db, "groups", groupId, "messages"), {
                message: newMessage,
                sentBy: user.email,
                timestamp: serverTimestamp(),
            });
            setNewMessage("");
            await fetchGroupMessages(); // Refresh the chat messages after successful send
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // Delete shared URL
    const handleDeleteUrl = async (urlId) => {
        try {
            await deleteDoc(doc(db, "groups", groupId, "sharedUrls", urlId));
            await fetchGroupUrls(); // Refresh the URLs after deletion
        } catch (error) {
            console.error("Error deleting URL:", error);
        }
    };

    // Delete chat message
    const handleDeleteMessage = async (messageId) => {
        try {
            await deleteDoc(doc(db, "groups", groupId, "messages", messageId));
            await fetchGroupMessages(); // Refresh the messages after deletion
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    // Fetch data when component mounts or groupId changes
    useEffect(() => {
        fetchGroupUrls();
        fetchGroupMessages();
    }, [groupId]);

    return (
        <>
            <MainNavbar />
            <div className="container mt-4" style={{ paddingTop: "60px", paddingBottom: "60px" }}>
                <h1>My Group</h1>

                {/* Form to share a URL */}
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
                    <button type="submit" className="btn btn-primary mt-3">
                        Share with Group
                    </button>
                </form>

                {message && <div className="alert alert-info mt-3">{message}</div>}

                {/* Display shared URLs */}
                <h2 className="mt-5">Shared URLs</h2>
                <ul className="list-group mt-3">
                    {groupUrls.map((sharedUrl) => (
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
                            style={{ width: "20px", cursor: "pointer" }} // Adjust size as needed
                            onClick={() => handleDeleteUrl(sharedUrl.id)}
                            disabled={processingUrl === sharedUrl.id} // Disabled condition
                            />
                        </div>
                        </li>
                    ))}
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
                            <img
                                src={dustbinIcon}
                                alt="Delete"
                                style={{ width: "20px", cursor: "pointer" }} // Adjust size as needed
                                onClick={() => handleDeleteMessage(msg.id)}
                                disabled={processingUrl === msg.id} // Disabled condition (if needed)
                            />
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
                        <button type="submit" className="btn btn-success mt-2">
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Groups;
